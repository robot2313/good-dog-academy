create index households_created_by_idx
on public.households (created_by);

create index household_members_invited_by_idx
on public.household_members (invited_by);

create index cloud_records_updated_by_idx
on public.cloud_records (updated_by);
