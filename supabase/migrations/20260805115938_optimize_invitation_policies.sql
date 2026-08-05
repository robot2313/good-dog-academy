drop policy household_invitations_select_owner on public.household_invitations;
drop policy household_invitations_select_invitee on public.household_invitations;

create policy household_invitations_select_authorized
on public.household_invitations for select
to authenticated
using (
  private.household_role_for_user(household_id) = 'owner'
  or (
    accepted_at is null
    and expires_at > now()
    and lower(invited_email) = lower((select auth.jwt()) ->> 'email')
  )
);

drop policy household_invitations_update_invitee on public.household_invitations;

create policy household_invitations_update_invitee
on public.household_invitations for update
to authenticated
using (
  accepted_at is null
  and expires_at > now()
  and lower(invited_email) = lower((select auth.jwt()) ->> 'email')
)
with check (
  accepted_by = (select auth.uid())
  and accepted_at is not null
  and lower(invited_email) = lower((select auth.jwt()) ->> 'email')
);

drop policy household_members_insert_first_owner on public.household_members;
drop policy household_members_insert_invitee on public.household_members;

create policy household_members_insert_authorized
on public.household_members for insert
to authenticated
with check (
  (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1
      from public.households household
      where household.id = household_members.household_id
        and household.created_by = (select auth.uid())
    )
  )
  or (
    user_id = (select auth.uid())
    and role in ('trainer', 'viewer')
    and exists (
      select 1
      from public.household_invitations invitation
      where invitation.household_id = household_members.household_id
        and invitation.role = household_members.role
        and invitation.accepted_at is null
        and invitation.expires_at > now()
        and lower(invitation.invited_email) = lower((select auth.jwt()) ->> 'email')
    )
  )
);
