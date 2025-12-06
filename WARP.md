# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

This is a Next.js 15 App Router project using React 19, TypeScript, Tailwind CSS, shadcn/ui-style components, NextAuth, Supabase, and OpenAI.

- Install dependencies (Node/npm):
  - `npm install`
- Run the dev server (hot reload, recommended during development):
  - `npm run dev`
- Create a production build:
  - `npm run build`
- Run the production server (after `npm run build`):
  - `npm start`
- Lint the codebase:
  - `npm run lint`

Tests are not configured (there is no test script or test framework set up yet). If you add tests in the future, document the commands here.

### Environment-dependent behaviour

Several parts of the app change behaviour based on environment variables:

- **OpenAI integration** (`app/api/openai/route.ts`)
  - Uses real OpenAI Chat Completions when `OPENAI_API_KEY` is set and not equal to the placeholder string.
  - Falls back to deterministic mock JSON responses per `agent` (e.g. `summarizer`, `market_researcher`, `competitor_analyst`, `business_strategist`, `risk_assessor`) when the key is missing or on error.
- **NextAuth / Google OAuth**
  - `lib/auth-config.ts` reads `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `NODE_ENV`.
  - If Google credentials are missing, the Google sign‑in flow will fail; the UI still works because there is also a local, in-browser auth fallback (see `contexts/auth-context.tsx`).
- **Supabase** (`lib/supabase.ts`, `app/api/init-db/route.ts`)
  - Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to create a real Supabase client when present and not equal to the placeholder URL.
  - Otherwise exports a `mockSupabaseClient` with stubbed auth methods so that components depending on Supabase do not crash during local development.
  - `app/api/init-db/route.ts` expects a server-side Supabase client (`createServerClient`) and calls `supabase.auth.admin.listUsers()` as a connectivity check.

## High-level architecture

### Overview

- **Framework**: Next.js 15 App Router project in the `app/` directory.
- **Styling / UI**: Tailwind CSS (`tailwind.config.ts`), shadcn-style components under `components/ui/`, and `framer-motion` for animations.
- **Auth**: NextAuth-based OAuth with a custom React auth context that also supports a local fallback login.
- **Persistence**: Supabase client wrapper with optional real backend; most current flows (waitlist, collaborations, validations list) store data in memory or in `localStorage` and are demo-style rather than fully persisted.
- **Core domain**: Multi-agent AI “startup idea validation” pipeline under `lib/ai-agents.ts` orchestrated by `validateIdeaWithMultipleAgents`, surfaced via the `/api/validate-idea` route and dashboard pages.

### App router structure (pages vs APIs)

- **Root layout**: `app/layout.tsx`
  - Wraps the entire app in:
    - `components/Providers` → `SessionProvider` from NextAuth (client-side), and
    - `contexts/AuthProvider` → custom auth context that exposes `user`, `signIn`, `signUp`, `signOut`, and `signInWithGoogle`.
  - Sets global `<html>` and `<body>` styling (dark theme) and imports `globals.css`.

- **Marketing / landing**
  - `app/page.tsx` is the marketing homepage, composed from section components:
    - `components/navigation.tsx`
    - `components/hero-section.tsx`
    - `components/features-section.tsx`
    - `components/how-it-works-section.tsx`
    - `components/waitlist-section.tsx`
  - `components/waitlist-section.tsx` posts to `/api/waitlist` and drives a simple “join the waitlist” flow with status messaging.

- **Auth flow**
  - `app/auth/page.tsx` implements the authentication UI using the `useAuth` context:
    - Tabs for **Sign In** and **Sign Up**.
    - Email/password flows are handled purely on the client and stored in `localStorage` for demo purposes.
    - `signInWithGoogle()` bridges to NextAuth’s Google provider; success redirects to the dashboard.
  - Server-side auth helpers:
    - `lib/auth-config.ts` defines `authOptions` with Google provider, JWT sessions, and custom `session`/`jwt` callbacks.
    - `lib/auth.ts` exposes `getAuthSession()` via `getServerSession(authOptions)` for server components or API routes that need server-side auth awareness.
  - NextAuth route
    - `app/api/api/auth/[...nextauth]/route.ts` wires NextAuth with `authOptions` and exports `GET`/`POST` handlers.

- **Dashboard shell and navigation**
  - `components/dashboard-sidebar.tsx` is the main shell for authenticated pages under `/dashboard/*`:
    - Uses `useAuth()` to show the current user and to sign out.
    - Client-only sidebar with mobile toggle using `framer-motion`.
    - Navigation links to `/dashboard`, `/dashboard/collaborations`, `/dashboard/validate`, `/dashboard/analytics`, and `/dashboard/settings`.
  - Each dashboard page (`app/dashboard/*.tsx`) is a client component that:
    - Calls `useAuth()` and redirects to `/auth` when not logged in.
    - Renders its content in a main area offset by the sidebar (`md:ml-64`).

- **Dashboard sections**
  - **Home / My Ideas** – `app/dashboard/page.tsx`
    - Displays hard-coded sample ideas and derived stats.
    - Clicking a sample idea seeds `localStorage` with a synthetic validation result (`sampleValidationResults`) and navigates to `/dashboard/validate/results`.
  - **Validate Idea wizard** – `app/dashboard/validate/page.tsx`
    - Multi-step form (four steps) that collects structured startup idea data.
    - On submit, posts to `/api/validate-idea` with an `idea_data` payload; includes `user.id` when available from auth context.
    - Stores the API response’s `validation_results` in `localStorage` under `validationResults` and navigates to `/dashboard/validate/results`.
  - **Validation results** – `app/dashboard/validate/results/page.tsx`
    - Reads `validationResults` from `localStorage`, or falls back to `sampleValidationResults` if present.
    - Renders a rich results page: viability score gauge, TAM/SAM/SOM cards, SWOT grid, founder scorecard, investor appeal, recommendations, etc., assuming the shape produced by the multi-agent pipeline.
  - **Analytics** – `app/dashboard/analytics/page.tsx`
    - Shows aggregate statistics, industry breakdown, and monthly trend data using hard-coded sample data only.
  - **Collaborations** – `app/dashboard/collaborations/page.tsx`
    - Demo “team collaboration” area storing team codes and members in `localStorage` keyed by `team_${user.id}`.
    - Generates a team code per user and provides a basic “join team” and “remove member” flow; there is no backend or cross-user communication.
  - **Settings** – `app/dashboard/settings/page.tsx`
    - Reads current user info from `useAuth()` and lets the user adjust profile metadata, notification toggles, and theme preferences.
    - Persists settings to `localStorage` under `futurevalidate_settings`.

### API routes and backend behaviour

- **Idea validation API** – `app/api/validate-idea/route.ts`
  - Accepts `POST` with JSON `{ idea_data: { ... }, user_id? }`.
  - Validates `idea_data` against `IdeaInputSchema` (`lib/schemas/idea`) using Zod.
  - On success, calls `runFreeValidation(idea)` and returns:
    - `success: true`
    - `idea_id`: generated from timestamp + random suffix (not persisted)
    - `validation_results`: the `FreeValidationResponse` produced by the free validation pipeline.
  - On validation errors, returns HTTP 400 with flattened Zod error details; on unhandled errors, returns HTTP 500.

- **Multi-agent validation pipeline** – `lib/ai-agents.ts` and `lib/agents/free-validator.ts`
  - `lib/ai-agents.ts` defines the core domain types (`IdeaData`, `ValidationResult`, `FounderScorecard`, `RedFlag`, `PivotSuggestion`, `Benchmarking`, `InvestorAppealScore`, `ExecutionRoadmap`, etc.) and five async agent functions:
    - `agent1_summarizeIdea(ideaData)` → structures the free-form idea into a canonical form.
    - `agent2_scrapeMarketData(structuredIdea, industry)` → estimates TAM/SAM, growth, trends, and target segments.
    - `agent3_analyzeCompetitors(structuredIdea, marketData)` → builds a competitor list and SWOT analysis.
    - `agent4_generateBusinessPlan(structuredIdea, marketData, competitorData)` → suggests business model, revenue streams, GTM, USP, monetization.
    - `agent5_assessRisksAndScore(allData)` → produces `ValidationResult` (viability score, TAM/SAM/SOM, SWOT, competitor data, business model, risks/recommendations, and several “premium” sections like founder scorecard, pivots, benchmarking, investor appeal, and execution roadmap).
  - Each agent function:
    - Constructs a natural-language prompt embedding structured data.
    - Calls `/api/openai` with `{ prompt, agent }` and expects JSON back.
    - On failure, falls back to deterministic or semi-random heuristic data, which is still shaped like the expected JSON.
  - `validateIdeaWithMultipleAgents(ideaData)` orchestrates the end-to-end flow sequentially:
    1. `agent1_summarizeIdea`
    2. `agent2_scrapeMarketData`
    3. `agent3_analyzeCompetitors`
    4. `agent4_generateBusinessPlan`
    5. `agent5_assessRisksAndScore`
  - `lib/agents/free-validator.ts` exposes `runFreeValidation(idea: IdeaInput)`:
    - Maps the frontend’s `IdeaInput` type to the internal `IdeaData` shape.
    - Calls `validateIdeaWithMultipleAgents`.
    - Derives a coarse `classification` ("high" | "possible" | "low" | "joke") from `viability_score`.
    - Extracts top risks, compresses textual recommendations into short “pivot” suggestions, builds a minimal TAM/SAM/SOM summary, and assembles a concise `summary` for the free tier.
    - This is what `/api/validate-idea` returns to the dashboard UI.

- **OpenAI proxy / mock** – `app/api/openai/route.ts`
  - Primary role is to centralize interaction with OpenAI’s Chat Completions API and enforce “JSON-only” responses at the app boundary.
  - When `OPENAI_API_KEY` is available and not a placeholder:
    - Sends a `POST` to `https://api.openai.com/v1/chat/completions` with `model: "gpt-4"` and a system message that instructs the model to always respond with valid JSON.
    - Parses the first choice’s `message.content`.
    - Attempts `JSON.parse` on the content; if it fails, wraps the raw text in a generic structured object via `getStructuredResponse(agent, content)`.
  - When the key is missing or on error:
    - Returns a canned mock JSON object from `getMockResponse(agent)` that matches what each agent expects.

- **Waitlist API** – `app/api/waitlist/route.ts`
  - In-memory array of `{ email, source, created_at }` records for demo purposes only (data resets on server restart).
  - `POST`:
    - Validates that `email` exists.
    - Checks for duplicate emails and either returns a “you’re already on the waitlist” message or appends a new entry.
  - `GET`:
    - Returns masked emails (first two characters preserved, rest replaced with `***`) and metadata.

- **Database init / Supabase connectivity** – `app/api/init-db/route.ts`, `lib/database-init.ts`, `lib/supabase.ts`
  - `app/api/init-db/route.ts` provides a simple “can we talk to Supabase?” endpoint by calling `supabase.auth.admin.listUsers()`.
  - `lib/database-init.ts` contains a more ambitious initializer that:
    - Queries `information_schema.tables` for public tables.
    - Conditionally invokes Supabase RPC functions like `create_profiles_table`, `create_ideas_table`, `create_validation_reports_table`, and `create_waitlist_table` when tables are missing.
  - `lib/supabase.ts` is the central place where the Supabase JS client is created (or mocked) based on environment.

## Notable utilities and patterns

- **Tailwind + class utilities**
  - `lib/utils.ts` exposes a single `cn(...inputs)` helper that merges class names using `clsx` and `tailwind-merge`; this is used across UI components.
  - `tailwind.config.ts` extends the theme with many CSS variables (`--background`, `--foreground`, `--card`, `--chart-*`, `--sidebar-*`, etc.) and includes the `tailwindcss-animate` plugin; most visuals depend on these variables being set in global CSS.

- **UI component library**
  - The `components/ui/` directory contains shadcn-style, Tailwind-based building blocks (buttons, inputs, dialogs, toasts, calendar, tabs, sidebar primitives, etc.).
  - These components are heavily reused to build both marketing and dashboard UIs; when adding new screens, prefer reusing these primitives instead of introducing new ad-hoc styles.

- **Auth context behaviour** – `contexts/auth-context.tsx`
  - The auth context merges two concepts:
    - NextAuth session user (if Google OAuth is configured and a session exists).
    - Local demo user stored in `localStorage` (`futurevalidate_user`) when signing in/up via email/password.
  - On mount, when there is no NextAuth session and not loading, the provider attempts to restore a local user from `localStorage`.
  - All dashboard pages rely on `useAuth()` for gating and user identity.

If you modify core flows (validation pipeline, auth, or Supabase integration), update this file so future Warp instances can rely on an accurate high-level map of the system.
