create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.household_role as enum ('owner', 'trainer', 'viewer');
create type public.cloud_record_type as enum (
  'owner',
  'dog',
  'behaviour_profile',
  'behaviour_assessment',
  'lesson_progress',
  'daily_plan',
  'training_session',
  'achievement',
  'progress',
  'notification_settings',
  'troubleshooter_attempt'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.cloud_records (
  household_id uuid not null references public.households(id) on delete cascade,
  entity_type public.cloud_record_type not null,
  record_id text not null check (char_length(trim(record_id)) between 1 and 160),
  dog_id text check (dog_id is null or char_length(trim(dog_id)) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  local_updated_at timestamptz not null,
  updated_by uuid not null references auth.users(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, entity_type, record_id)
);

create index household_members_user_id_idx on public.household_members(user_id, household_id);
create index cloud_records_household_dog_idx on public.cloud_records(household_id, dog_id, entity_type);
create index cloud_records_household_updated_idx on public.cloud_records(household_id, updated_at);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.cloud_records enable row level security;

revoke all on public.profiles from anon;
revoke all on public.households from anon;
revoke all on public.household_members from anon;
revoke all on public.cloud_records from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.households to authenticated;
grant select, insert, update, delete on public.household_members to authenticated;
grant select, insert, update, delete on public.cloud_records to authenticated;

create function private.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.household_members member
      where member.household_id = target_household_id
        and member.user_id = (select auth.uid())
    );
$$;

create function private.household_role_for_user(target_household_id uuid)
returns public.household_role
language sql
stable
security definer
set search_path = ''
as $$
  select member.role
  from public.household_members member
  where member.household_id = target_household_id
    and member.user_id = (select auth.uid())
  limit 1;
$$;

create function private.shares_household_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.household_members mine
      join public.household_members theirs
        on theirs.household_id = mine.household_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id = target_user_id
    );
$$;

revoke all on function private.is_household_member(uuid) from public;
revoke all on function private.household_role_for_user(uuid) from public;
revoke all on function private.shares_household_with(uuid) from public;
grant execute on function private.is_household_member(uuid) to authenticated;
grant execute on function private.household_role_for_user(uuid) to authenticated;
grant execute on function private.shares_household_with(uuid) to authenticated;

create policy profiles_select_team
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or private.shares_household_with(id));

create policy profiles_insert_self
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

create policy profiles_update_self
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy households_select_member_or_creator
on public.households for select
to authenticated
using (created_by = (select auth.uid()) or private.is_household_member(id));

create policy households_insert_creator
on public.households for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy households_update_owner
on public.households for update
to authenticated
using (private.household_role_for_user(id) = 'owner')
with check (private.household_role_for_user(id) = 'owner');

create policy households_delete_owner
on public.households for delete
to authenticated
using (private.household_role_for_user(id) = 'owner');

create policy household_members_select_member
on public.household_members for select
to authenticated
using (user_id = (select auth.uid()) or private.is_household_member(household_id));

create policy household_members_insert_first_owner
on public.household_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1
    from public.households household
    where household.id = household_id
      and household.created_by = (select auth.uid())
  )
);

create policy household_members_update_owner
on public.household_members for update
to authenticated
using (private.household_role_for_user(household_id) = 'owner')
with check (private.household_role_for_user(household_id) = 'owner');

create policy household_members_delete_owner
on public.household_members for delete
to authenticated
using (private.household_role_for_user(household_id) = 'owner');

create policy cloud_records_select_member
on public.cloud_records for select
to authenticated
using (private.is_household_member(household_id));

create policy cloud_records_insert_editor
on public.cloud_records for insert
to authenticated
with check (
  private.household_role_for_user(household_id) in ('owner', 'trainer')
  and updated_by = (select auth.uid())
);

create policy cloud_records_update_editor
on public.cloud_records for update
to authenticated
using (private.household_role_for_user(household_id) in ('owner', 'trainer'))
with check (
  private.household_role_for_user(household_id) in ('owner', 'trainer')
  and updated_by = (select auth.uid())
);

create policy cloud_records_delete_editor
on public.cloud_records for delete
to authenticated
using (private.household_role_for_user(household_id) in ('owner', 'trainer'));

create function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.version_cloud_record()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.version = old.version + 1;
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public;
revoke all on function private.version_cloud_record() from public;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();

create trigger households_touch_updated_at
before update on public.households
for each row execute function private.touch_updated_at();

create trigger cloud_records_version_update
before update on public.cloud_records
for each row execute function private.version_cloud_record();

alter publication supabase_realtime add table public.household_members;
alter publication supabase_realtime add table public.cloud_records;
