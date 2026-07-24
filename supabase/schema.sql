-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query)

create table if not exists public.user_tunings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  notes integer[] not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.user_tunings enable row level security;

create policy "Users can read own tunings"
  on public.user_tunings for select
  using (auth.uid() = user_id);

create policy "Users can insert own tunings"
  on public.user_tunings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tunings"
  on public.user_tunings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tunings"
  on public.user_tunings for delete
  using (auth.uid() = user_id);
