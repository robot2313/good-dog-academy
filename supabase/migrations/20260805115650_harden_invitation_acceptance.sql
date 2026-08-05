grant update on public.household_invitations to authenticated;

create policy household_invitations_select_invitee
on public.household_invitations for select
to authenticated
using (
  accepted_at is null
  and expires_at > now()
  and lower(invited_email) = lower((select auth.jwt() ->> 'email'))
);

create policy household_invitations_update_invitee
on public.household_invitations for update
to authenticated
using (
  accepted_at is null
  and expires_at > now()
  and lower(invited_email) = lower((select auth.jwt() ->> 'email'))
)
with check (
  accepted_by = (select auth.uid())
  and accepted_at is not null
  and lower(invited_email) = lower((select auth.jwt() ->> 'email'))
);

create policy household_members_insert_invitee
on public.household_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role in ('trainer', 'viewer')
  and exists (
    select 1
    from public.household_invitations invitation
    where invitation.household_id = household_members.household_id
      and invitation.role = household_members.role
      and invitation.accepted_at is null
      and invitation.expires_at > now()
      and lower(invitation.invited_email) = lower((select auth.jwt() ->> 'email'))
  )
);

create function private.protect_invitation_acceptance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.household_id <> old.household_id
    or new.invited_email <> old.invited_email
    or new.role <> old.role
    or new.invite_code <> old.invite_code
    or new.created_by <> old.created_by
    or new.expires_at <> old.expires_at
    or new.created_at <> old.created_at then
    raise exception 'Invitation details cannot be changed';
  end if;

  if old.accepted_at is not null
    or new.accepted_at is null
    or new.accepted_by <> (select auth.uid()) then
    raise exception 'Invitation acceptance is invalid';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_invitation_acceptance() from public;

create trigger household_invitation_acceptance_guard
before update on public.household_invitations
for each row execute function private.protect_invitation_acceptance();

drop policy household_activity_insert_actor on public.household_activity;
revoke insert on public.household_activity from authenticated;
revoke usage, select on sequence public.household_activity_id_seq from authenticated;

create or replace function private.log_cloud_record_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_action public.household_activity_action;
  activity_record public.cloud_records;
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

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
    household_id, actor_user_id, action, entity_type, record_id, dog_id
  ) values (
    activity_record.household_id,
    actor_id,
    activity_action,
    activity_record.entity_type,
    activity_record.record_id,
    activity_record.dog_id
  );

  return activity_record;
end;
$$;

revoke all on function private.log_cloud_record_activity() from public;

create function private.log_household_member_joined()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invited_by is not null then
    insert into public.household_activity (household_id, actor_user_id, action)
    values (new.household_id, new.user_id, 'member_joined');
  end if;
  return new;
end;
$$;

revoke all on function private.log_household_member_joined() from public;

create trigger household_member_joined_activity
after insert on public.household_members
for each row execute function private.log_household_member_joined();

create or replace function public.accept_household_invitation(invite_code_input text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  accepting_user_id uuid := auth.uid();
  accepting_email text := lower(auth.jwt() ->> 'email');
  invitation public.household_invitations;
begin
  if accepting_user_id is null or accepting_email is null then
    raise exception 'Authentication required';
  end if;

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

  return invitation.household_id;
end;
$$;

revoke all on function public.accept_household_invitation(text) from public;
revoke all on function public.accept_household_invitation(text) from anon;
grant execute on function public.accept_household_invitation(text) to authenticated;
