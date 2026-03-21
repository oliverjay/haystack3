# Haystack

A fast 1:1 social chemistry game. Answer 10 questions, send a link, find out how compatible you really are.

## Setup

1. **Install dependencies**: `npm install`
2. **Set up Supabase**: Create a project at supabase.com, then run `supabase/migration.sql` in the SQL editor
3. **Configure env**: Copy `.env.example` to `.env` and fill in your Supabase URL and anon key
4. **Run dev server**: `npm run dev`

## Tech Stack

- SvelteKit + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + REST)
- Vercel (hosting + edge functions)

## Project Structure

```
src/
  lib/
    components/     # BinaryInput, SliderInput, SpectrumInput
    device.ts       # Anonymous device ID + unlock state
    questions.ts    # All questions, archetypes, pair dynamics, insight templates
    quiz-state.ts   # localStorage save/resume for quiz progress
    scoring.ts      # Compatibility scoring (similarity/complementary/blended)
    supabase.ts     # Supabase client
  routes/
    /               # Landing page
    /q              # Quiz flow (name + emoji + 10 questions)
    /q/complete     # Saves to Supabase, computes match, redirects
    /share/[id]     # Share screen after quiz completion
    /s/[id]         # Invite landing for respondents
    /result/[s]/[m] # Tension interstitial + result screen
    /dashboard/[id] # Match list
    /gate           # Unlock gate (2 completions or $1)
    /og/[id]        # Dynamic OG image endpoint
    /privacy        # Privacy policy
    /terms          # Terms of service
```

## Deploy

```bash
npm run build   # Builds for Vercel
vercel deploy   # Deploy to Vercel
```
