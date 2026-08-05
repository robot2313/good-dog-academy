create type public.household_activity_action as enum (
  'member_joined',
  'record_created',
  'record_updated',
  'record_deleted',
  'role_changed'
);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_email text not null check (length(trim(invited_email)) between 3 and 320),
  role public.household_role not null check (role in ('trainer', 'viewer')),
  invite_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (invite_code)
);

create unique index household_invitations_pending_email_idx
on public.household_invitations (household_id, lower(invited_email))
where accepted_at is null;

create index household_invitations_household_idx
on public.household_invitations (household_id, created_at desc);

create index household_invitations_created_by_idx
on public.household_invitations (created_by);

create index household_invitations_accepted_by_idx
on public.household_invitations (accepted_by);

create table public.household_activity (
  id bigint generated always as identity primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action public.household_activity_action not null,
  entity_type public.cloud_record_type,
  record_id text,
  dog_id text,
  occurred_at timestamptz not null default now()
);

create index household_activity_household_time_idx
on public.household_activity (household_id, occurred_at desc);

create index household_activity_actor_idx
on public.household_activity (actor_user_id);

drop index if exists public.household_members_user_id_idx;
create unique index household_members_one_household_per_user_idx
on public.household_members (user_id);

alter table public.household_invitations enable row level security;
alter table public.household_activity enable row level security;

revoke all on public.household_invitations from anon;
revoke all on public.household_activity from anon;
grant select, insert, delete on public.household_invitations to authenticated;
grant select, insert on public.household_activity to authenticated;
grant usage, select on sequence public.household_activity_id_seq to authenticated;

create policy household_invitations_select_owner
on public.household_invitations for select
to authenticated
using (private.household_role_for_user(household_id) = 'owner');

create policy household_invitations_insert_owner
on public.household_invitations for insert
to authenticated
with check (
  private.household_role_for_user(household_id) = 'owner'
  and created_by = (select auth.uid())
  and role in ('trainer', 'viewer')
  and accepted_at is null
  and accepted_by is null
);

create policy household_invitations_delete_owner
on public.household_invitations for delete
to authenticated
using (private.household_role_for_user(household_id) = 'owner');

create policy household_activity_select_member
on public.household_activity for select
to authenticated
using (private.is_household_member(household_id));

create policy household_activity_insert_actor
on public.household_activity for insert
to authenticated
with check (
  private.household_role_for_user(household_id) in ('owner', 'trainer')
  and actor_user_id = (select auth.uid())
  and action in ('record_created', 'record_updated', 'record_deleted')
);

create function private.log_cloud_record_activity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  activity_action public.household_activity_action;
  activity_record public.cloud_records;
begin
  if tg_op = 'UPDATE'
    and new.payload is not distinct from old.payload
    and new.deleted_at is not distinct from old.deleted_at then
    return new;
  end if;

  if tg_op = 'DELETE' then
    activity_action := 'record_deleted';
    activity_record := old;
  elsif tg_op = 'INSERT' then
    activity_action := 'record_created';
    activity_record := new;
  elsif new.deleted_at is not null and old.deleted_at is null then
    activity_action := 'record_deleted';
    activity_record := new;
  else
    activity_action := 'record_updated';
    activity_record := new;
  end if;

  insert into public.household_activity (
    household_id,
    actor_user_id,
    action,
    entity_type,
    record_id,
    dog_id
  ) values (
    activity_record.household_id,
    activity_record.updated_by,
    activity_action,
    activity_record.entity_type,
    activity_record.record_id,
    activity_record.dog_id
  );

  return activity_record;
end;
$$;

revoke all on function private.log_cloud_record_activity() from public;

create trigger cloud_records_activity_log
after insert or update or delete on public.cloud_records
for each row execute function private.log_cloud_record_activity();

create function private.protect_household_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (new.household_id <> old.household_id or new.user_id <> old.user_id) then
    raise exception 'Household membership identity cannot be changed';
  end if;

  if old.role = 'owner'
    and (tg_op = 'DELETE' or new.role <> 'owner')
    and (
      select count(*)
      from public.household_members member
      where member.household_id = old.household_id
        and member.role = 'owner'
    ) <= 1 then
    raise exception 'A household must keep at least one owner';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.protect_household_membership() from public;

create trigger household_membership_guard
before update or delete on public.household_members
for each row execute function private.protect_household_membership();

create function public.accept_household_invitation(invite_code_input text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepting_user_id uuid := auth.uid();
  accepting_email text;
  invitation public.household_invitations;
begin
  if accepting_user_id is null then
    raise exception 'Authentication required';
  end if;

  select lower(user_record.email)
  into accepting_email
  from auth.users user_record
  where user_record.id = accepting_user_id;

  select invitation_record.*
  into invitation
  from public.household_invitations invitation_record
  where invitation_record.invite_code = upper(trim(invite_code_input))
    and invitation_record.accepted_at is null
    and invitation_record.expires_at > now()
    and lower(invitation_record.invited_email) = accepting_email
  for update;

  if invitation.id is null then
    raise exception 'Invite code is invalid, expired, or belongs to another email';
  end if;

  if exists (
    select 1
    from public.household_members member
    where member.user_id = accepting_user_id
  ) then
    raise exception 'This account already belongs to a Team Dog household';
  end if;

  insert into public.household_members (household_id, user_id, role, invited_by)
  values (invitation.household_id, accepting_user_id, invitation.role, invitation.created_by);

  update public.household_invitations
  set accepted_at = now(), accepted_by = accepting_user_id
  where id = invitation.id;

  insert into public.household_activity (household_id, actor_user_id, action)
  values (invitation.household_id, accepting_user_id, 'member_joined');

  return invitation.household_id;
end;
$$;

revoke all on function public.accept_household_invitation(text) from public;
revoke all on function public.accept_household_invitation(text) from anon;
grant execute on function public.accept_household_invitation(text) to authenticated;

alter publication supabase_realtime add table public.household_invitations;
alter publication supabase_realtime add table public.household_activity;
