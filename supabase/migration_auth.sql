-- Haystack Auth Migration
-- Adds Supabase Auth integration, invite codes, and proper RLS
-- Run this in the Supabase SQL editor AFTER enabling Auth in the dashboard

-- 1. Add user_id columns linking to auth.users
alter table sessions add column if not exists user_id uuid references auth.users(id);
alter table responses add column if not exists user_id uuid references auth.users(id);
alter table devices add column if not exists user_id uuid references auth.users(id);

-- 2. Add invite_code to sessions for safe share links
alter table sessions add column if not exists invite_code text unique;
create index if not exists idx_sessions_invite_code on sessions(invite_code);
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_responses_user_id on responses(user_id);

-- 3. Drop all old "Anyone can..." RLS policies
drop policy if exists "Anyone can read sessions" on sessions;
drop policy if exists "Anyone can create sessions" on sessions;
drop policy if exists "Anyone can update sessions" on sessions;
drop policy if exists "Anyone can read responses" on responses;
drop policy if exists "Anyone can create responses" on responses;
drop policy if exists "Anyone can update responses" on responses;
drop policy if exists "Anyone can read matches" on matches;
drop policy if exists "Anyone can create matches" on matches;
drop policy if exists "Anyone can update match reactions" on matches;
drop policy if exists "Anyone can read devices" on devices;
drop policy if exists "Anyone can create devices" on devices;
drop policy if exists "Anyone can update devices" on devices;

-- 4. New RLS policies for sessions
-- Owners can read their own sessions
create policy "Owner can read own sessions"
  on sessions for select
  using (auth.uid() = user_id);

-- Public invite lookup: anyone authenticated can look up a session by invite_code
-- (only returns rows that match the invite_code filter the app applies)
create policy "Authenticated users can lookup sessions by invite_code"
  on sessions for select
  using (auth.uid() is not null);

-- Authenticated users can create sessions (must set user_id = their own)
create policy "Authenticated users can create sessions"
  on sessions for insert
  with check (auth.uid() = user_id);

-- Owners can update their own sessions
create policy "Owner can update own sessions"
  on sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. New RLS policies for responses
-- Users can read responses if they own the response, own the session, or have a response in the same session
create policy "Participants can read responses"
  on responses for select
  using (
    auth.uid() is not null
    and (
      -- user owns this response
      user_id = auth.uid()
      or
      -- user is the session creator
      exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid())
      or
      -- user has their own response in the same session (they're a participant)
      exists (select 1 from responses r where r.session_id = responses.session_id and r.user_id = auth.uid())
    )
  );

-- Authenticated users can insert responses (must set user_id = their own)
create policy "Authenticated users can create responses"
  on responses for insert
  with check (auth.uid() = user_id);

-- Users can update their own responses
create policy "Owner can update own responses"
  on responses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. New RLS policies for matches
-- Authenticated users can read matches in sessions they own or responded to
create policy "Participants can read matches"
  on matches for select
  using (
    auth.uid() is not null
    and (
      exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid())
      or
      creator_response_id in (select id from responses where user_id = auth.uid())
      or
      responder_response_id in (select id from responses where user_id = auth.uid())
    )
  );

-- Authenticated users can create matches
create policy "Authenticated users can create matches"
  on matches for insert
  with check (auth.uid() is not null);

-- Participants can update matches (for reactions)
create policy "Participants can update matches"
  on matches for update
  using (
    auth.uid() is not null
    and (
      exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid())
      or
      creator_response_id in (select id from responses where user_id = auth.uid())
      or
      responder_response_id in (select id from responses where user_id = auth.uid())
    )
  )
  with check (true);

-- 7. New RLS policies for devices
-- Users can only access their own device record
create policy "Users can read own device"
  on devices for select
  using (auth.uid() = user_id);

create policy "Users can create own device"
  on devices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own device"
  on devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
