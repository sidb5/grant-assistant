-- BiotechOS SciENcv Suite — Database Schema
-- Run this in the Supabase SQL Editor to initialize the database from scratch.

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  institution text,
  created_at timestamptz default now()
);

create table audit_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  action_type text not null,
  grant_title text,
  original_text text,
  modified_text text,
  diff_summary text,
  char_count_before integer,
  char_count_after integer,
  char_limit integer,
  citations_selected jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table audit_records enable row level security;

create policy "Users can only see their own profile"
  on profiles for all using (auth.uid() = id);

create policy "Users can only see their own audit records"
  on audit_records for all using (auth.uid() = user_id);
