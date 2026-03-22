-- Fix: RLS policies on matches and responses cause 500 errors due to
-- recursive evaluation (responses → sessions → responses, etc.)
-- Solution: SECURITY DEFINER helpers that bypass RLS for existence checks.

-- Helper: check if the current user owns a session
create or replace function is_session_owner(p_session_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from sessions where id = p_session_id and user_id = auth.uid()
  );
$$;

-- Helper: check if the current user owns a specific response
create or replace function is_response_owner(p_response_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from responses where id = p_response_id and user_id = auth.uid()
  );
$$;

-- Helper: check if the current user has any response in the same session
create or replace function is_session_participant(p_session_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from responses where session_id = p_session_id and user_id = auth.uid()
  );
$$;

-- ── Fix responses RLS ──

drop policy if exists "Participants can read responses" on responses;

create policy "Participants can read responses"
  on responses for select
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or is_session_owner(session_id)
      or is_session_participant(session_id)
    )
  );

-- ── Fix matches RLS ──

drop policy if exists "Participants can read matches" on matches;
drop policy if exists "Participants can update matches" on matches;

create policy "Participants can read matches"
  on matches for select
  using (
    auth.uid() is not null
    and (
      is_session_owner(session_id)
      or is_response_owner(creator_response_id)
      or is_response_owner(responder_response_id)
    )
  );

create policy "Participants can update matches"
  on matches for update
  using (
    auth.uid() is not null
    and (
      is_session_owner(session_id)
      or is_response_owner(creator_response_id)
      or is_response_owner(responder_response_id)
    )
  )
  with check (true);
