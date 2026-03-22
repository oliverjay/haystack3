-- Haystack MVP Database Schema
-- Run this in the Supabase SQL editor

-- Sessions: created when User A completes the quiz
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  creator_name text not null,
  creator_emoji text not null,
  creator_device_id uuid not null,
  created_at timestamptz not null default now()
);

-- Responses: one per user per session
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  responder_name text not null,
  responder_emoji text not null,
  device_id uuid not null,
  answers jsonb not null,
  archetype text not null,
  completion_seconds integer not null default 0,
  is_creator boolean not null default false,
  created_at timestamptz not null default now()
);

-- Matches: computed when a responder submits
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  creator_response_id uuid not null references responses(id) on delete cascade,
  responder_response_id uuid not null references responses(id) on delete cascade,
  score integer not null,
  question_scores jsonb not null,
  biggest_tension text not null,
  strongest_alignment text not null,
  pair_dynamic text not null,
  creator_agree boolean,
  responder_agree boolean,
  created_at timestamptz not null default now()
);

-- Devices: tracks anonymous unlock state
create table if not exists devices (
  id uuid primary key,
  completed_matches integer not null default 0,
  unlocked_at timestamptz,
  paid_at timestamptz,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

-- Email for session recovery and notifications
alter table sessions add column if not exists creator_email text;

-- Legacy: phone number (deprecated, use email instead)
alter table sessions add column if not exists creator_phone text;

-- Custom avatar image (base64 data URL, optional)
alter table sessions add column if not exists creator_avatar_url text;
alter table responses add column if not exists avatar_url text;

-- Indexes for common queries
create index if not exists idx_responses_session on responses(session_id);
create index if not exists idx_responses_device on responses(device_id);
create index if not exists idx_matches_session on matches(session_id);
create index if not exists idx_matches_creator_response on matches(creator_response_id);
create index if not exists idx_matches_responder_response on matches(responder_response_id);
create index if not exists idx_sessions_creator_email on sessions(creator_email);

-- RLS Policies
-- Sessions: anyone can read (needed for invite landing), insert with device_id
alter table sessions enable row level security;

create policy "Anyone can read sessions"
  on sessions for select
  using (true);

create policy "Anyone can create sessions"
  on sessions for insert
  with check (true);

-- Responses: anyone can read responses in a session they're part of, anyone can insert
alter table responses enable row level security;

create policy "Anyone can read responses"
  on responses for select
  using (true);

create policy "Anyone can create responses"
  on responses for insert
  with check (true);

-- Matches: anyone can read, anyone can insert, update for reactions
alter table matches enable row level security;

create policy "Anyone can read matches"
  on matches for select
  using (true);

create policy "Anyone can create matches"
  on matches for insert
  with check (true);

create policy "Anyone can update match reactions"
  on matches for update
  using (true)
  with check (true);

-- Allow updating sessions (for phone, avatar)
create policy "Anyone can update sessions"
  on sessions for update
  using (true)
  with check (true);

-- Allow updating responses (for avatar)
create policy "Anyone can update responses"
  on responses for update
  using (true)
  with check (true);

-- Devices: read/write own device only (matched by PK)
alter table devices enable row level security;

create policy "Anyone can read devices"
  on devices for select
  using (true);

create policy "Anyone can create devices"
  on devices for insert
  with check (true);

create policy "Anyone can update devices"
  on devices for update
  using (true)
  with check (true);
