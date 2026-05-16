-- Create user_data table
create table user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table user_data enable row level security;

-- Policies
create policy "Users can view their own data"
on user_data for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own data"
on user_data for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own data"
on user_data for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
