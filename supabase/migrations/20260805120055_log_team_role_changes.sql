create function private.log_household_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if new.role is distinct from old.role then
    if actor_id is null then
      raise exception 'Authentication required';
    end if;
    insert into public.household_activity (
      household_id, actor_user_id, action, record_id
    ) values (
      new.household_id, actor_id, 'role_changed', new.user_id::text
    );
  end if;
  return new;
end;
$$;

revoke all on function private.log_household_role_change() from public;

create trigger household_role_change_activity
after update on public.household_members
for each row execute function private.log_household_role_change();
