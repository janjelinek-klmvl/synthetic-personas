# Synthetic Personas

Customer-facing app for testing ideas (insights, propositions, campaigns) against synthetic audiences. SP doesn't run the simulation itself — it composes a stimulus, calls **Audience Studio**'s `/api/v1/*` endpoints to execute the run, and renders the result. Multi-tenant: every user belongs to a company (`api_clients` row) and can be impersonated by BNT super-admins.

---

## Table of contents

- [Quick start](#quick-start)
- [Tech stack](#tech-stack)
- [Environment variables](#environment-variables)
- [Auth model](#auth-model)
- [Relationship to Audience Studio](#relationship-to-audience-studio)
- [Route map](#route-map)
- [Feature areas](#feature-areas)
- [Run flow (end-to-end)](#run-flow-end-to-end)
- [Data storage](#data-storage)
- [`lib/` inventory](#lib-inventory)
- [Gotchas & non-obvious things](#gotchas--non-obvious-things)

---

## Quick start

```bash
npm install
# default port 3000 — leave it as-is so Audience Studio can own 3001
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint
```

Prerequisites:

1. `.env.local` with the vars in [Environment variables](#environment-variables).
2. Audience Studio running and reachable at `AUDIENCE_STUDIO_URL` (defaults to `http://localhost:3001`).
3. A Supabase project shared with AS — SP reads/writes the same DB.
4. At least one `api_clients` row in that DB whose `api_key` matches a real key minted by AS (or the env fallback).
5. A user signed up via Supabase Auth with a corresponding `profiles` row linking to that `api_clients.id`, OR a `bnt_admins` row for super-admin access.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14.2.35** (App Router) | Uses `middleware.ts` (Next 14 naming) — **not** AS's `proxy.ts` |
| React / TS | React 18, TypeScript 5 | `@types/node` 20 |
| Styling | **Tailwind 3.4** + heavy inline styles | Most components use `style={{...}}` rather than utility classes |
| Auth/DB | Supabase (`@supabase/ssr 0.10`, `@supabase/supabase-js 2.106`) | Shared project with AS |
| LLM | Anthropic Claude (`claude-haiku-4-5-20251001`) | Used only for `/api/brief` and `/api/extract-idea`; the heavy run pipeline runs in AS |
| Parsing | `mammoth` (DOCX server-side), `pdfjs-dist` (PDF client-side) | |

⚠ **Diffs vs Audience Studio:** Next 14 vs 16, React 18 vs 19, Tailwind 3 vs 4. Two apps, two stacks — don't blindly port code between them.

No Node engine pinned. No CI config in repo.

---

## Environment variables

| Var | Scope | Purpose |
|---|---|---|
| `AUDIENCE_STUDIO_URL` | **server** | Base URL of AS (e.g. `http://localhost:3001`). Trailing slashes stripped. |
| `AUDIENCE_STUDIO_API_KEY` | **server** | Fallback Bearer for AS when no session is available. **Not currently used by any feature route** — the per-company key from `api_clients.api_key` is preferred. |
| `ANTHROPIC_API_KEY` | **server** | For `/api/brief` + `/api/extract-idea`. `lib/anthropic.ts:14-22` falls back to reading `.env.local` directly if the env var is empty (handles shells that export `=""`). |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL (same project as AS) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Browser + SSR cookie auth |
| `SUPABASE_SERVICE_KEY` | **server** | Used by `supabaseAdmin` for every server-side DB read/write |
| `NEXT_PUBLIC_SP_BASE_URL` | public | Base URL embedded into invite acceptance links (e.g. `http://localhost:3000`) |
| `NODE_ENV` | runtime | Sets impersonation cookie `secure: true` in prod |

Template at `.env.local.example`. The real `.env.local` (gitignored) currently points at AS on `http://localhost:3001` and the shared Supabase project.

---

## Auth model

### Session auth (`middleware.ts`)

- Public paths: `/login`, `/accept-invite/*`, `/api/accept-invite/*`, `/_next`, `/favicon`, `/auth/callback`.
- Everything else requires a Supabase session — on miss, redirect to `/login?next=<path>`.
- If already authenticated, hitting `/login` redirects to `/`.
- Login uses email/password via `supabase.auth.signInWithPassword`. Same Supabase project + `auth.users` table as AS — credentials are shared.

### Company concept (`lib/currentCompany.ts`)

A "company" is an `api_clients` row, holding `id`, `org_name`, `api_key` (AS Bearer token), access lists (`audience_access`, `quant_metric_access`, `qual_module_access`), `active`, `credit_balance`, `plan_id`, `monthly_allowance`, `current_period_started_at`.

A user's company is resolved by:

1. **Profile match** — if a `profiles` row exists with `company_id`, that's the user's company. Role: `admin` or `member`.
2. **BNT super-admin** — if a `bnt_admins` row exists (and no profile), the user must pick a company via the `sp_imp_co` impersonation cookie. They then act as `admin` of that company with `impersonating: true`. If no cookie → `NoActiveCompanyError` → bounced to the company picker.
3. **Otherwise** — `NoCompanyError` (auth user exists but isn't onboarded).

If a user has both a `profiles` row AND `bnt_admins`, **profile wins** (the user is treated as a company user; loses super-admin powers in SP).

The returned `CurrentCompany` carries the AS `apiKey` used by every `lib/audienceStudio.ts` call.

### Errors thrown by `getCurrentCompany()`

| Error | Routes map to | Pages do |
|---|---|---|
| `NotAuthenticatedError` | `401` | redirect to `/login` |
| `NoCompanyError` | `403` | redirect to `/login?reason=no_profile` |
| `NoActiveCompanyError` | `403 NO_ACTIVE_COMPANY` | redirect to `/` (BNT picker) |

### Impersonation (BNT super-admins)

- `GET /impersonate?company_id=<uuid>&next=<path>` — sets `sp_imp_co` cookie (HTTP-only, 8h TTL) and redirects.
- `POST /api/impersonate/end` — clears the cookie.
- The yellow **"Viewing as Pilsner Urquell (super-admin)"** banner is `components/ImpersonationBanner.tsx`, rendered whenever `/api/me` returns `impersonating: true`. The Exit button calls `/api/impersonate/end` and reloads.
- Company picker UI: `components/PickCompanyLanding.tsx`, gated in `app/page.tsx:71-79` (`is_bnt_admin && !company`).

---

## Relationship to Audience Studio

SP is a consume-only client of AS's `/api/v1/*` public API. The thin client lives in `lib/audienceStudio.ts`.

**Base URL:** `process.env.AUDIENCE_STUDIO_URL` (trailing slashes stripped).

**Auth:** `Authorization: Bearer <apiKey>` on every request. `apiKey` is the per-company `api_clients.api_key` from `getCurrentCompany()`. The env fallback `AUDIENCE_STUDIO_API_KEY` exists but isn't called by any current route.

**Exported functions:**

| Function | AS endpoint | Used by |
|---|---|---|
| `listAudiences(apiKey)` | `GET /api/v1/audiences` | `/api/audiences`, `/api/brief` |
| `startRun(apiKey, input)` | `POST /api/v1/runs` | `/api/runs` (POST) |
| `getRun(apiKey, runId)` | `GET /api/v1/runs/{runId}` | `/api/runs/[id]` (poll refresh) |
| `chatRun(apiKey, runId, input)` | `POST /api/v1/runs/{runId}/chat` | `/api/runs/[id]/chat/messages` |

`asFetch<T>` always uses `cache: 'no-store'`. Errors from AS are lifted onto the thrown `Error` (`error`, `detail`, HTTP `status`). Callers re-surface as `502`.

Response types are local mirrors of AS shapes in `lib/types-as.ts`.

---

## Route map

### User-facing pages

| Path | Description |
|---|---|
| `/` | Main composer: 3-stage wizard (idea+audience+settings → brief questions → run + report). Shows `PickCompanyLanding` for un-scoped BNT admins. |
| `/login` | Email/password sign-in. Shows `reason=no_profile` banner if redirected. |
| `/personas` | Lists audiences available to the current company (from `/api/audiences`). |
| `/history` | Past runs grid; filters by idea type and audience. Opens `ReportDrawer` for details. |
| `/credits` | Plan, balance, 30-day usage chart, recent ledger, top-up packages. SSR-guarded. |
| `/pricing` | Legacy redirect → `/credits`. |
| `/settings/profile` | Display name edit; shows company + role read-only. |
| `/settings/team` | Admin-only. Members list + invitations. Members get redirected to `/settings/profile`. |
| `/accept-invite/[token]` | Public invite-acceptance flow; handles both company invites and BNT-admin invites. |
| `/impersonate` | Route handler (GET) — sets the impersonation cookie. Not a page. |

### API routes

Auth column: `S` = Supabase session via middleware; `C` = company via `getCurrentCompany()`; `A` = admin role; `B` = BNT super-admin.

**Identity / company**
- `GET /api/me` (S) — identity + company + role + impersonating + is_bnt_admin.
- `GET /api/me/credits` (C) — plan, balance, period usage, 30-day chart, recent ledger.
- `GET /api/companies` (B) — all companies for the BNT switcher.

**Audiences** (proxies to AS)
- `GET /api/audiences` (C) — proxies `listAudiences(ctx.apiKey)`.

**Idea → brief → run (composer)**
- `POST /api/extract-idea` (C) — file-drop extraction (text/PDF/image → Claude). `maxDuration: 60s`.
- `POST /api/brief` (C) — Claude-Haiku brief extraction + adaptive question generation.
- `POST /api/propositions` (C) — persist a proposition into `sp_propositions`.
- `GET /api/propositions/[id]` (C) — load one proposition.

**Runs**
- `GET /api/runs` (C) — list all runs for the company.
- `POST /api/runs` (C) — create SP run; fans out one `startRun` per audience to AS in parallel; persists to `sp_runs`.
- `GET /api/runs/[id]` (C) — read SP run; refreshes non-terminal per-audience state by calling `getRun(asRunId)` on AS.
- `DELETE /api/runs/[id]` (C) — delete one SP run.

**Chat with completed run**
- `GET /api/runs/[id]/chat/messages` (C) — find/create `chat_conversations` row; return messages.
- `POST /api/runs/[id]/chat/messages` (C) — append user message, call `chatRun()` on AS, persist assistant message + evidence/credits/usage.

**Team**
- `GET /api/team/members` (C) — list members (joins `profiles` + `auth.users.listUsers` for emails).
- `DELETE /api/team/members/[id]` (A) — remove member; self-deletion blocked.
- `GET /api/team/invitations` (A) — list invitations with computed URLs.
- `POST /api/team/invitations` (A) — create invite (random base64url token); inserts into `invitations`.
- `DELETE /api/team/invitations/[id]` (A) — revoke an unaccepted invite.

**Invite acceptance** (public/session)
- `POST /api/accept-invite/[token]` (S) — accepts company invite (creates `profiles`) or BNT invite (creates `bnt_admins`).

**Impersonation**
- `POST /api/impersonate/end` (cookie-only) — clears `sp_imp_co`.

> `app/api/questions/` exists but is empty — legacy.

---

## Feature areas

**New-test flow / composer.** Stage 1: idea text + idea type (insight / proposition / campaign) + audience(s) + research settings + respondent count, with a live credit-cost estimate. Stage 2: per-question wizard from `/api/brief` (Claude generates type-aware questions; auto-skips if input is already complete). Stage 3: run streaming via polling. Files: `app/page.tsx` (~750 lines), `components/IdeaTypeDropdown.tsx`, `PersonaDropdown.tsx`, `ResearchSettingsDropdown.tsx`, `QuestionStep.tsx`, `BriefLoadingState.tsx`, `TestLoadingState.tsx`, `SetupSummary.tsx`, `IdeaExtractionPanel.tsx`. Stimulus rendering for AS: `lib/stimulus.ts:renderStimulus()`.

**Persona / audience viewing.** `/personas` lists AS audiences granted to the company with synthesized emoji/accent. Files: `app/personas/page.tsx`, `lib/personas.ts` (`AudiencesProvider` + `useAudiences` context, single-flight fetch of `/api/audiences`, caches audiences + quant_metrics + qual_modules + pricing + balance).

**Report rendering.** Aggregate + quant per-metric scores + qual themes + respondent detail. Files: `components/ReportSection.tsx`, `ThemeCard.tsx`, `DetailDrawer.tsx`, `SignalRadar.tsx`, `PersonaTabBar.tsx`. `lib/qualField.ts` maps varying AS qual-module field names to semantic slots so the renderer stays generic.

**Chat with a completed run.** Two modes: `report` (chat with the synthesised report — single Claude call grounded in stored `run.result`, prompt-cached) and `audience` (re-query a subset of respondents — runs an evidence pass and synthesises). One conversation per (sp_run, user). Files: `components/chat/ChatPanel.tsx`, `ChatComposer.tsx`, `ChatMessage.tsx`. Persisted in `chat_conversations` + `chat_messages`.

**History.** Past runs grid filtered by idea type / audience; opens `ReportDrawer` for the full report. Files: `app/history/page.tsx`, `lib/history.ts` (wraps `/api/runs`), `components/ReportDrawer.tsx`.

**Credits / billing.** Plan name, balance, monthly allowance, 30-day usage chart with forecasted runway, recent ledger entries, top-up packages (admin-only Buy buttons). Read-only from SP — actual deduction happens AS-side. Files: `app/credits/page.tsx`, `CreditsClient.tsx`, `components/credits/{CreditsHero,UsageChart,ActivityList,TopupPackages,CostPanel}.tsx`; backend `app/api/me/credits/route.ts`.

**Team management.** Admin-only members + invitations. Invite emails are delivered out-of-band; the API just generates random base64url tokens and the UI shows a copy-paste link. Files: `app/settings/team/{page.tsx,TeamClient.tsx}`; backend `app/api/team/...`.

**Profile.** Display-name editing only. Files: `app/settings/profile/{page.tsx,ProfileForm.tsx}`.

**Super-admin company switching.** BNT staff (`bnt_admins` rows) can pick any company via `/impersonate?company_id=…` and act as admin of that company. The persistent yellow banner ("Viewing as X (super-admin)") with an Exit button is rendered in the root layout. Files: `app/impersonate/route.ts`, `app/api/impersonate/end/route.ts`, `app/api/companies/route.ts`, `components/ImpersonationBanner.tsx`, `components/PickCompanyLanding.tsx`.

**Onboarding via invites.** Both flavours handled: company invites create a `profiles` row; BNT-admin invites create a `bnt_admins` row. Files: `app/accept-invite/[token]/{page.tsx,AcceptForm.tsx}`, `app/api/accept-invite/[token]/route.ts`.

---

## Run flow (end-to-end)

User clicks **"Run test"** in `app/page.tsx`:

1. **Save proposition** — `POST /api/propositions { idea, idea_type, brief, file_content }` → `saveProposition()` inserts into `sp_propositions` (`company_id` scoped). Returns `{ id, ... }`.

2. **Start run** — `POST /api/runs { proposition_id, audience_ids, respondent_count, quant_metric_ids?, qual_module_ids? }`:
   - Loads the proposition (company-scoped).
   - Generates a fresh `runId` (UUID) for the SP run.
   - Builds the AS idea text via `renderStimulus(idea_type, idea, brief)`.
   - **Fans out** `startRun()` to AS for each audience in parallel via `Promise.all`. Each AS response: `{ run_id (as_run_id), status, poll_url }`. Failures captured per-audience without aborting the others.
   - Builds a `RunRecord` with `per_audience: { audienceId → { as_run_id, status, progress_step, error? } }` and `overall_status` from `deriveOverall()`.
   - **Persists** to `sp_runs` via `saveRun()`.
   - Returns `202 { run_id, record }`.

3. **Client polls** — `usePollingRun(runId)` fetches `/api/runs/<runId>` every 3 s (`POLL_INTERVAL_MS`) until `overall_status !== 'running'`.

4. **Server-side polling refresh** — `GET /api/runs/[id]`:
   - Loads SP run from `sp_runs`.
   - For each per-audience entry in `queued`/`running`, calls `getRun(apiKey, as_run_id)` on AS.
   - Merges new `status`, `progress_step`, `result`, `latency_ms`, `error` back into `per_audience`.
   - Recomputes `overall_status`, upserts `sp_runs`, returns the merged record.

5. **Render** — `TestLoadingState` while polling, then `ReportSection`. History is the same `sp_runs` list (no separate store).

6. **Chat (post-completion)** — once at least one audience is `succeeded`:
   - `GET /api/runs/[id]/chat/messages` → find/create `chat_conversations` row keyed by `(sp_run_id, created_by)` (one conversation per SP run per user); return existing messages.
   - `POST /api/runs/[id]/chat/messages { mode, content, audience_id?, respondent_count? }`:
     1. Picks an AS run — explicit `audience_id` or the **first succeeded audience** otherwise.
     2. Inserts the user message into `chat_messages` first (persists even if AS fails).
     3. Builds trimmed history (`MAX_HISTORY_TURNS = 20`, excluding the just-inserted message).
     4. Calls `chatRun(apiKey, asRunId, { mode, question, history, respondent_count })`.
     5. Persists assistant message with `respondent_evidence`, `credits_charged`, `usage`, `chat_query_id`.
     6. Returns `{ user_message, assistant_message, balance }` — lets the composer update the credit counter.

---

## Data storage

SP persists its own data in the **same Supabase project as AS**. All writes go through `supabaseAdmin` (service-role) and are explicitly scoped by `company_id`.

### Tables read/written by SP

| Table | Owner | SP usage |
|---|---|---|
| `auth.users` | Supabase Auth (shared) | read (session, `listUsers` to join emails) |
| `api_clients` | AS (shared) | read (company info, AS apiKey, credits, access lists, plan) |
| `profiles` | shared | read/write (`company_id`, `role`, `display_name`) |
| `bnt_admins` | shared | read (super-admin check), write (BNT invite acceptance) |
| `invitations` | shared | read/write (company-scoped invites) |
| `credit_ledger` | AS, **read-only from SP** | read (ledger for `/credits` view) |
| `sp_propositions` | **SP-owned** | read/write (proposition snapshots) |
| `sp_runs` | **SP-owned** | read/write/delete (run records mirroring AS runs) |
| `chat_conversations` | **SP-owned** | read/write (one row per sp_run × user) |
| `chat_messages` | **SP-owned** | read/write (message log with evidence, credits, usage) |

SP's "own" tables live in the same Supabase project / public schema as AS — they coexist alongside `api_clients`, `credit_ledger`, etc. There is no separate database.

Earlier SP used filesystem JSON under `./data/` — fully migrated to Supabase. The `data/` directory may still contain legacy fixtures.

---

## `lib/` inventory

| File | Purpose |
|---|---|
| `anthropic.ts` | Cached Anthropic client factory. Reads `ANTHROPIC_API_KEY`; falls back to parsing `.env.local` directly (handles shells exporting empty values). |
| `audienceStudio.ts` | Thin server-only client over AS `/api/v1/*` — `listAudiences`, `startRun`, `getRun`, `chatRun`. |
| `credits.ts` | **Stub** — intentionally empty `export {}`. Live credit data flows through `/api/me/credits` and `useAudiences().balance`. |
| `currentCompany.ts` | Resolves a session into a `CurrentCompany` (userId, role, company, AS apiKey, access lists, credit balance, impersonation flags). Defines `NotAuthenticatedError`, `NoActiveCompanyError`, `NoCompanyError`, plus `getBntAdminStatus()`. |
| `estimate.ts` | Client-safe credit-cost estimator mirroring AS's formula (AS remains source of truth). |
| `extractIdea.ts` | Server-side Claude Haiku call turning dropped files (text/PDF/image) into an `ExtractOutcome`. |
| `fileParser.ts` | Client-side file reader. TXT/DOCX/MD → text (DOCX via `mammoth`); PDF → base64 + media_type; images → base64 + media_type. Enforces 10 MB / 3000 words. |
| `history.ts` | Thin wrappers `loadHistory()` → `GET /api/runs`, `deleteEntry()` → `DELETE /api/runs/[id]`, plus formatters. |
| `json.ts` | `extractJsonObject(text)` — pulls the first balanced `{…}` from an LLM blob, tolerant of leading prose / code fences. |
| `personas.ts` | Client-only React context (`AudiencesProvider` + `useAudiences`). Single-flight fetch of `/api/audiences`. |
| `qualField.ts` | Maps varying AS qual-module field names to semantic slots (title/severity/body/quote/affected/evidence/mitigation). |
| `stimulus.ts` | Per-idea-type field schemas (insight 4-field / proposition 15-field+2-list / campaign), `fieldsFor()`, `typeLabel()`, and `renderStimulus()`. |
| `store.ts` | Per-company persistence for **propositions** (`sp_propositions`) and **runs** (`sp_runs`). All reads/writes via `supabaseAdmin`, scoped by `companyId`. |
| `supabase-server.ts` | `supabaseServer()` (SSR cookies-aware) + `supabaseAdmin` (service-role). Imports `next/headers` — **never import from client code**. |
| `supabase.ts` | Client-safe `supabaseBrowser()` only. |
| `types-as.ts` | Mirrors of AS response shapes. |
| `types.ts` | SP-local types: `IdeaBrief`, `BriefQuestion`, `BriefResponse`, `ExtractOutcome`, `TestContext`. |
| `usePollingRun.ts` | Client hook polling `/api/runs/<runId>` every 3 s until terminal. |

---

## Gotchas & non-obvious things

- **Per-company API key is the right one.** Routes resolve `ctx.apiKey` from `api_clients.api_key` via the user's `profiles.company_id` (or impersonated company). The env `AUDIENCE_STUDIO_API_KEY` is a fallback that **isn't currently used** by any feature route. If AS returns 401, check that `ctx.apiKey` is populated and that the `api_clients` row has the audience(s) granted in `audience_access[]`.

- **`.env.local` Anthropic key fallback.** Some shells (Claude Desktop/Code) export `ANTHROPIC_API_KEY=""`. Next.js won't override that, so `lib/anthropic.ts` reads `.env.local` off disk as a fallback. If you ever move the file or run from a different cwd, brief generation silently fails over.

- **Idea types have different field schemas.** `insight` / `proposition` / `campaign` aren't just labels — each has its own field schema in `lib/stimulus.ts`. The brief wizard, the file-drop extractor, and the final AS stimulus all derive from `fieldsFor(ideaType)`. New fields go there (and AS may need parallel updates).

- **Adaptive question wizard auto-skips.** `app/page.tsx:163-167` — if Claude returns zero questions AND extraction was successful, stage 2 is **skipped** and the run starts immediately. Easy to miss when debugging "why didn't I see questions".

- **Multi-audience runs can be `partial`.** Some audiences succeed, others fail. The history card shows a "Partial" badge when `selected_quant/qual_module_ids` is shorter than the universe.

- **Chat picks an AS run per turn.** SP has one chat conversation per SP run, but each AS run is per-audience. The route defaults to the **first succeeded audience** if `audience_id` isn't passed. Multi-audience runs need the UI to pass `audience_id` explicitly.

- **Credits ledger is read-only from SP.** SP never deducts credits itself. AS handles deductions on run execution and chat queries; SP just reads `credit_ledger` and `api_clients.credit_balance` for the `/credits` view and the pre-flight gate. The pre-flight `insufficientCredits` check is purely UX — the real backstop is AS rejecting the run.

- **Credit balance gating.** The Run-test button is disabled when `balance < estimate * audience_count`. The estimate uses `pricing.formula` returned by `/api/audiences` (i.e. AS) — if AS changes the formula, SP picks it up automatically.

- **Impersonation cookie is HTTP-only, 8 h TTL.** Every server-side `getCurrentCompany()` re-reads `sp_imp_co`, so the "viewing as" view switches per request. A stale cookie pointing at a deleted company silently falls through to `NoActiveCompanyError` (you'll get bounced to `/`).

- **A user with both `profiles` AND `bnt_admins` is treated as a company user** and loses super-admin powers in SP. Unusual but possible.

- **Errors from `getCurrentCompany()` have distinct downstream behaviour.** Routes consistently map `NotAuthenticatedError → 401`, `NoCompanyError → 403`, `NoActiveCompanyError → 403 NO_ACTIVE_COMPANY`. Page-level guards redirect to `/login`, `/`, or `/login?reason=no_profile`. Be consistent in new routes.

- **`POST /api/runs` is not transactional.** It writes the SP run after fanning out to AS. If AS starts one audience and the network drops before `saveRun()` returns, the AS run is orphaned (no SP record references it).

- **No persona / audience write surface.** SP is consume-only against AS — it cannot create or edit audiences, metrics, or modules. If `/personas` is empty, the AS-side `api_clients.audience_access` is the culprit.

- **`/api/questions` is an empty directory.** No `route.ts`. Legacy.

- **`lib/credits.ts` is intentionally empty** (`export {}`). Don't import from it — use `/api/me/credits` instead.

- **Tailwind 3 + heavy inline styles.** Most components style via `style={{...}}` rather than utility classes. If you decide to migrate to Tailwind 4, this is a significant undertaking.

- **DM Sans is the public-font stand-in for Roobert** (brand font requires a commercial license).

- **Build-time safety.** `lib/supabase-server.ts:36-45` uses placeholder URL/key if env is missing so `next build` doesn't crash. Runtime obviously still needs real values.

- **Common port pitfall.** The `.env.local` says `AUDIENCE_STUDIO_URL=http://localhost:3001` and `NEXT_PUBLIC_SP_BASE_URL=http://localhost:3000`. If you flip them, SP will fetch from itself, hit "Failed to fetch", and stamp `POLL_FAILED` onto the run record permanently (the `/api/runs/[id]` route only refreshes non-terminal audiences — failed ones stay failed). Always run **AS on 3001 and SP on 3000**.
