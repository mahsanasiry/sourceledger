# SourceLedger

SourceLedger is a research workspace for recording claims, tracking where information comes from, and seeing how evidence changes over time. It is built around the questions a researcher keeps asking:

- Where did this claim come from?
- Which sources support it, and which contradict it?
- What exactly did the source say, not just where is the link?
- Has the evidence changed since?
- Who changed a note or conclusion, and why?

Each claim has an evidence file: supporting, contradicting and context sources side by side, the exact passage each source contains, notes, a review status with a recorded reason, and the full change history.

There are no automatic imports and no AI features. Everything in the workspace is entered and judged by a person.

## Try it

Live demo: https://sourceledger.mahsanasiry0.workers.dev

Sign in with the demo account, or create your own account (every new account gets its own sample workspace).

- Email: test@gmail.com
- Password: test1234

The demo account is shared, so other visitors may change its data. Settings has a button that adds a fresh sample workspace.

## Problems this project solves

- **History you can audit.** Every change to a claim, source or link is written to a history table by database triggers, with the author taken from the signed-in session and the reason supplied by the user. Clients cannot edit or delete history entries.
- **Access control that does not depend on the client.** Row Level Security policies restrict every table to the owner of the workspace, and composite foreign keys stop a link from joining a claim and a source from different workspaces.
- **State that survives refresh and Back.** Search, filters, sort order and the open source live in the URL. Parsing and serialising are pure functions covered by unit tests.
- **Failure handled in the open.** Flagging a source updates the screen immediately and rolls back if the request fails. Forms explain what is wrong, and lists have loading, empty, error and retry states.

## Testing at a glance

71 unit and component tests, accessibility checks with axe-core, and end-to-end tests in a real browser. CI runs lint, typecheck, formatting, tests and the build on every pull request.

## Screenshots

![Evidence file](docs/screenshots/evidence.png)
![Sources with filters](docs/screenshots/sources.png)
![Evidence graph](docs/screenshots/graph.png)
![History](docs/screenshots/history.png)

## Features

- Workspaces: create, rename, delete, export.
- Claims: a claim or research question with a status (open, supported, contested, refuted) and a written conclusion.
- Sources: address, title, publication date, type, the exact passage, and a note.
- Links between claims and sources with a relation: supports, contradicts, or context. A source can be linked to several claims.
- Evidence board: three columns per claim, with a source detail panel beside it.
- Search, filter and sort, all stored in the URL. Refresh, Back and Forward restore the exact state, including which source is open.
- Review status per source (unreviewed, in review, verified, rejected). Changing it requires a reason.
- Link an existing source to a claim from the claim page, choosing the relation and an optional reason. Sources that are already linked to the claim are not offered again.
- Flagging a source for a second look, applied optimistically and rolled back if the request fails.
- Audit trail for workspaces, claims, sources and links, written by database triggers so it cannot be skipped by the client.
- Loading, empty, error, success and retry states on every screen.
- Export a workspace as JSON (everything, including history) or CSV (one row per claim-source link, plus unlinked sources).
- Evidence graph: claims and sources as an interactive graph. Select a source to open it, focus on one claim, or filter by relation. Only the nodes in view are rendered, and sources wrap into extra columns so large workspaces stay usable.

## Stack

- Next.js (App Router), React, TypeScript in strict mode
- Tailwind CSS with CSS variables as design tokens
- TanStack Query for server state
- React Hook Form and Zod for forms and validation
- Supabase: PostgreSQL, Auth, and Row Level Security
- React Flow for the graph
- Vitest and React Testing Library, axe-core for accessibility checks
- Playwright for end-to-end tests
- GitHub Actions for CI

## Architecture

```
src/
  app/            routes: (public) landing and auth, (workspace) workspaces and settings
  features/       workspaces, claims, sources, evidence, activity, export, auth
  components/     ui primitives, layout, shared
  lib/            supabase clients, query setup, validation schemas, utilities
  tests/          unit, integration, e2e
supabase/
  migrations/     schema, constraints, indexes, policies, triggers, sample data
```

Choices worth knowing about:

- Pages are Server Components that resolve route parameters and render a client feature component. Client Components are used where there is real interaction: forms, filters, the evidence board, the graph.
- Data access lives in each feature's `api.ts`. Every response is parsed with a Zod schema, so a schema mismatch fails loudly instead of leaking `undefined` into the UI.
- Access control is enforced in the database. Every table has Row Level Security, and child tables check ownership of the parent workspace. Composite foreign keys guarantee that a link can only join a claim and a source from the same workspace.
- The audit trail is written by `AFTER` triggers. The client supplies an optional `last_change_reason`, which the trigger copies into the history entry along with the changed fields and the actor.
- Filter state is parsed from and serialized to the URL by pure functions in `features/sources/source-query.ts`. Typing in the search box replaces the current history entry after a short pause, and every other filter change pushes a new one.
- `src/proxy.ts` refreshes the Supabase session and redirects signed-out visitors away from protected routes.

## Setup

Requirements: Node.js 22 or newer and a Supabase project.

1. Install dependencies:

   ```
   npm install
   ```

2. Create a Supabase project at https://supabase.com.
3. In the Supabase SQL editor, run `supabase/migrations/0001_schema.sql`, then `supabase/migrations/0002_sample_data.sql`.
4. Copy the environment file and fill it in:

   ```
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in Project Settings, API.
   - `NEXT_PUBLIC_SITE_URL` is the address the app runs on, `http://localhost:3000` in development.
   - `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are only needed for the signed-in end-to-end test.

5. In Authentication, URL Configuration, add `http://localhost:3000/auth/callback` to the redirect URLs. For local development you can also turn off "Confirm email" under Authentication, Providers, Email so new accounts can sign in immediately.
6. Start the app:

   ```
   npm run dev
   ```

Every new account receives a small sample workspace through a database trigger. You can add another copy from Settings.

## Scripts

| Script                 | What it does                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the development server       |
| `npm run build`        | Production build                   |
| `npm start`            | Serve the production build         |
| `npm run lint`         | ESLint, fails on any warning       |
| `npm run typecheck`    | TypeScript in strict mode, no emit |
| `npm run format:check` | Check formatting with Prettier     |
| `npm test`             | Unit and component tests           |
| `npm run test:e2e`     | Playwright end-to-end tests        |

## Testing

- Unit tests cover the logic that is easy to get subtly wrong: URL state parsing and serialization, filtering and sorting, CSV escaping (including spreadsheet formula neutralisation), export contents, graph layout, evidence grouping and validation schemas.
- Component tests cover the review form (a reason is mandatory), the source form, the evidence board, the filter bar (debounce, push versus replace, following the URL on Back) and the sign-in form. The components that matter most also run through axe-core.
- End-to-end tests live in `src/tests/e2e`. The public-pages spec needs nothing but the running app. The signed-in journey creates a workspace, claim and source, reviews it, checks that filters survive reload and Back and Forward, reads the history, opens the graph, exports JSON, and cleans up. It needs a confirmed Supabase user in `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`.

Install the browser once before the first end-to-end run:

```
npx playwright install chromium
```

CI runs lint, typecheck, format check, unit tests and the build on every pull request.

## Trade-offs

- Data is fetched in the browser with TanStack Query and protected by Row Level Security, rather than through custom API routes. That keeps the code small and the permission rules in one place, at the cost of no server-side prefetching.
- A workspace belongs to one owner. Sharing and roles would need a membership table and updated policies.
- The graph uses a deterministic two-sided layout (claims on the left, sources ordered by the claims they connect to) instead of a force simulation. It is stable between renders and cheap for large workspaces, but it does not cluster by topic.
- Row types are described with Zod schemas instead of generated database types, so there is no generation step to keep in sync.

## Limitations

- Email and password sign-in only.
- No pagination in lists; the history view shows the latest 300 entries. Exports read everything.
- The history stores the changed fields with their previous and new values, not a full snapshot of each row.
- Concurrent edits to the same record are last write wins.
