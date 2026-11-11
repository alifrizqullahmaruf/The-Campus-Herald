# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Workflow (required for every request that changes files)

The user writes in Indonesian; reply in Indonesian. Plain questions and explanations need no plan file; answer them directly.

Sessions start in plan mode (`.claude/settings.json`), so no file can be edited until the user approves a plan.

1. **Plan first, no edits yet.** Turn every instruction or change request into a plan file at `docs/plans/YYYY-MM-DD-<topic>.md`. This is the only place for plans: skills that save plans or specs elsewhere (such as superpowers' `writing-plans` / `brainstorming`) must save them here instead. The plan must contain a table that separates the work into:

   | # | Task | Who (User / Claude) | Files to change | Status |
   |---|------|---------------------|-----------------|--------|

2. **Ask before proceeding.** During brainstorming and planning, ask the user for their opinion and get explicit confirmation. Do not edit code until the user approves the plan.
3. **Execute fully.** Once the user approves, carry out every task in the plan through to completion.
4. **Debug and verify.** Afterwards, check the whole change: run `npm test -- --run`, `npm run lint` and `npm run build`, and run the app if relevant. Then run the `code-reviewer` subagent **once** on the change before committing. Fix Kritis/Tinggi/Sedang findings; Rendah ones may become follow-ups. Review again only if the fixes were large. Then update the plan file with what was actually done, what changed from the plan, and the verification results.
5. **Tidy the plan file.** Finally, restructure the plan file so it reads cleanly: goal, task table with final status, changed files, verification results, open follow-ups.

### Subagents (`.claude/agents/`)

| Subagent | Use it | May change |
|----------|--------|------------|
| `code-reviewer` | Once per change, before committing (step 4) | Nothing (read-only report) |
| `qa-tester` | Only when the user asks (or before a release): tests the front end like a user, writes and runs tests | Only `e2e/` and `__tests__/`; app bugs are reported (`test.fixme()`), never patched |
| `clean-code` | Only when the user asks: **propose** (read-only list for a plan), then **apply** for approved items | App code, approved items only, no behaviour change |

Keep agent runs few and their reports short.

### Git

- Commit only after the user confirms. Every commit is pushed to `origin` right after it is created (`git push`); no separate confirmation is needed for the push.
- Commits are authored by the user only (their git identity). Do not add `Co-Authored-By: Claude` or any other Claude/AI attribution to commit messages or PR descriptions.

## Project

**Side Notes**, the community blog of **The Campus Herald** (one university's student press society), replacing news sharing over WhatsApp groups and Instagram. The spec and the client are "The Campus Herald"; the site's brand is "Side Notes · by The Campus Herald" (see `docs/design.md` section 0, and `lib/site.ts` for the name, tagline and description). UI copy calls categories "topics", not "desks". The full spec (brief, requirements, SRS scope, diagrams, ER model, PostgreSQL schema) is in `docs/the-campus-herald.md`. Read it before building features. Some of its later sections are written in Indonesian.

The visual design system (colour tokens, category colours, typography, components, page layouts for public pages and the author/admin dashboard, and template features that are out of scope) is in `docs/design.md`. Follow it for any UI work.

`resource_private/` is git-ignored and holds the user's private reference material (e.g. a screen recording of the "Crumpet Riot" Framer template used as UI inspiration). It exists only on the user's machine.

Progress is tracked in `docs/plans/2026-10-15-roadmap.md`, a **local-only file** (git-ignored since 2026-10-21, so it is not on GitHub and may be missing in a fresh clone); it holds the phase plan, the daily schedule and the notes collected for later phases. Phase 1 (design with sample data) and Phase 2 (PostgreSQL, `docs/plans/2026-11-02-fase-2-database.md`) are done: every page reads the database, but there is **no login or saving yet**. Phases 3–5 (auth, workflow, release) are brainstormed with the user before work starts.

## Architecture

- `app/(public)/`: reader-facing pages sharing a header/footer layout (`/`, `/categories/[slug]`, `/articles/[slug]`, `/search`, `/authors/[id]`, `/about`). The layout also mounts the ⌘K palette listener and keeps everything in one wrapper `div` (see Page fade below).
- `app/dashboard/`: author pages (`/dashboard`, `/dashboard/articles/new|[id]`) and admin pages (`/dashboard/review`, `/dashboard/articles`, `/dashboard/authors`) in a sidebar shell. `app/login/` stands alone. All dashboard UI is a preview: buttons change client state only, and `getPreviewUser` in `lib/data/session.ts` reads the preview user from the database (Rafi as author, Dewi as admin); `isAdminPath` (which dashboard paths are admin pages) is in `lib/dashboard-paths.ts`.
- `app/api/search/route.ts`: JSON search used by the palette.
- `lib/data/*`: **the only way pages read data.** These functions are async and read PostgreSQL through `sql` from `lib/db.ts`, each with `"use cache"`, `cacheLife("max")` and the tags `articles` and/or `users` (Phase 4 invalidates them with `updateTag` after saving). Columns are always named, never `select *`, so `password_hash` stays out of cached results; rows are mapped to the camelCase types, with dates as ISO strings. Ids from URLs go through `isValidId` (`lib/data/ids.ts`) first, since PostgreSQL rejects an out-of-range integer with an error. Public functions return published articles only. Search and prev/next run in JavaScript over the cached published list, so `lib/search.ts` stays the one matching rule. `lib/mock/*` is now only the seed (`npm run db:seed`) and the unit-test fakes (`*-data.ts`); the sample article bodies are hand-written in `lib/mock/bodies.ts` (news ~300 words, features ~500, opinion ~600; only HTML the editor can open).
- `lib/types.ts` mirrors the schema in `db/migrations/` (the stage 06 schema plus the columns the site needs; `cover_alt` has no field until Phase 4). `lib/categories.ts` is the single category → colour mapping; use it instead of hard-coding colours. `lib/search.ts` holds the one matching rule shared by server and browser.
- `components/ui` (Button, Card, pills, badges), `components/layout`, `components/article`, `components/search`, `components/author`, `components/dashboard`, `components/editor` (Tiptap).
- Dynamic routes prerender via `generateStaticParams` (Cache Components requires at least one param; `dynamicParams` is unavailable). Unknown params call `notFound()`, which streams the 404 UI with HTTP 200.
- Instant navigation: all five `[slug]`/`[id]` pages read `params` at the top and opt out with `export const instant = false` (otherwise `next dev` warns "URL data outside of Suspense"). Do not move that read into `<Suspense>`: the prerendered HTML then becomes the fallback, React reveals the content only after the cover photo loads, and visitors without JavaScript see only the fallback (tried and reverted, `docs/plans/2026-10-28-render-langsung-foto-lokal.md`). A click on these pages waits for the server instead. `instant = false` also turns off the static-shell check for these routes, so in Phase 2 check the build output: they must stay ○ (static), which needs `"use cache"` on their database reads.
- Tiptap must stay client-only (`next/dynamic` with `ssr: false`): it calls `Math.random()` while initialising, which prerendering rejects.
- `/styleguide` is an internal, noindex page showing every token and component.
- **Motion** (docs/design.md 2.5): `components/physics/physics-pile.tsx` runs Matter.js piles of real DOM links (hero cards, footer nav pills); Matter.js is `import()`ed after load / on view, items rest at CSS poses (`[data-physics]` rules in globals.css) for no-JS and reduced motion, and `[data-physics-obstacle]` elements inside a pile are collision bodies, measured once their own entrance animation has ended (`entranceDone`; measured mid-rise, the hero cards landed on the headline). Items at rest sleep (Matter.js sleeping), and any drag or resize wakes them all. Below `lg` the hero shows fewer cards (4 on tablets, 2 on phones) so the pile stays below the sticky header; measure at 320–1023px before changing the hero items or the physics settings, since the outcome is chaotic. `components/home/topic-rows.tsx` is the draggable drifting pill rows. Pure helpers (drag threshold, loop offset, seeded randomness, `pileStyle` start poses for `pile-card` grids, `riseStyle` tilts for `rise-row` lists) are in `lib/motion.ts`. Scroll-linked effects (`hero-tilt`, `pile-card`, `rise-row` for the Most read rows, the About and Most read section entrances `reveal-pop`/`reveal-rise`/`reveal-tilt`/`reveal-word`, each at rest once fully on screen, the About illustration's `buried-*`, the article `read-progress` bar), page-title word rise (`components/ui/rise-text.tsx`, used by `SectionHeader` for h1; `on="scroll"` and `SectionHeader reveal` for section titles that rise as they scroll in), and the logo wobble (`.mark-note`) are CSS (page changes: see Page fade); the About numbers count up in `components/about/count-up.tsx`.
- **Page fade:** one `<ViewTransition>` in `app/layout.tsx` fades the new page in on every page change (public, login, dashboard and between them; 200 ms, CSS under "Page changes" in globals.css). It reacts only to transitions of type `page`: always link with `@/components/ui/link` (ESLint forbids `next/link` elsewhere) and pass `{ transitionTypes: PAGE_TRANSITION }` to `router.push`/`replace`. Untyped transitions (Suspense reveals, the ⌘K palette, the editor loading, back/forward, later server actions and `router.refresh()`) do not animate. The old page is hidden at once, not faded, because Next scrolls to the top as the transition starts. React gives the boundary's direct child elements their own transition names, so each layout wraps its content in one element; chrome that stays on screen (public header, dashboard sidebar and tab bar) keeps its own `view-transition-name` plus `view-transition-class: chrome` and stays put.
- **Images:** writer avatars are DiceBear Notionists served by `app/avatars/[id]/route.ts` (use `<Avatar userId>`; `lib/avatar.ts` must stay server-side, client code uses `lib/avatar-src.ts`). Sample-article cover photos are listed in `lib/mock/covers.json`: for now Picsum photos downloaded into `public/covers/` (`npm run covers:picsum`, no key), later optionally Unsplash API photos (`npm run covers`, hotlinked as Unsplash requires). `ArticleCover` renders them with the photographer credit: local files through the Next image optimiser, Unsplash photos through `UnsplashImage` (Unsplash's own sizing).

## Commands

- `npm run dev`: dev server (Turbopack). If new Tailwind classes do not show up, restart it.
- `npm run build`: production build. Prerendering reads the database, so the server must be on and migrated and seeded (`npm run db:start`); data changed directly in the database shows up after the next build
- `npm run start`: serve the production build
- `npm run lint`: ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)
- `npm test`: Vitest in watch mode; `npm test -- --run` runs once, `npx vitest run __tests__/search.test.tsx` runs a single file, `-t "<name>"` filters by test name
- `npm run fonts`: rebuild the cut-down display font `app/fonts/archivo-display.woff2` (Archivo at width 125, weights 800–900) from the google/fonts repository; run only when the character set or weights change
- `npm run covers:picsum`: download the hand-picked Picsum cover photos (no key, 1600×1200 WebP) into `public/covers/` and list them in `lib/mock/covers.json`
- `npm run covers`: fetch Unsplash cover photos for the sample articles into `lib/mock/covers.json` (needs `UNSPLASH_ACCESS_KEY` in `.env.local`; add `-- --force` to replace existing covers; run once, 2 requests per article)
- `npm run db:setup` (once), `npm run db:start`, `npm run db:stop`: a PostgreSQL 18 server just for this project on `localhost:5433` (`scripts/db-local.mjs`), run from the installed programs, not the installed Windows service on 5432, whose superuser password this does not need. `db:setup` writes `DATABASE_URL` with a generated password to `.env.local`; the password never goes through chat, so do not print or read that file. The data is in `%LOCALAPPDATA%\side-notes`, outside OneDrive. The server does not start by itself: after a restart of the computer, run `db:start`
- `npm run db:check`: check the PostgreSQL connection in `DATABASE_URL`. Prints version, database and user, or a hint on failure. The client for app code is `sql` in `lib/db.ts` (server-only), imported only by `lib/data/*`; scripts use `withDatabase` in `scripts/db-client.mjs`, which keeps the password out of their output
- `npm run db:migrate`: apply the files in `db/migrations/` that have not run yet, in name order, each in one transaction (recorded in `schema_migrations`). Applied files are never edited: a schema change is a new numbered file, and the SQL in `docs/the-campus-herald.md` is updated with it
- `npm run db:seed`: replace all users and articles with the sample data from `lib/mock` (`scripts/db-seed.ts`, run with `tsx`; the five topics come from migration `002`). Keeps ids, runs in one transaction, can be repeated. Refuses a database on another host unless given `-- --remote`. On this computer every sample account gets the password in `DEV_PASSWORD` (`.env.local`, created at random on the first run, never printed; it is what E2E and you log in with). With `--remote` they get `!no-login`, which never verifies
- `npm run db:set-password <email>`: set one account's password (typed twice, hidden; piped input is read as lines, and one line counts as both). Works on any database: this is how real accounts get a password. Hashing is scrypt in `lib/auth/password.ts`, whose `verifyPassword` rejects any value not in exactly its format and parameters
- `npm run test:e2e`: Playwright against a production build (run `npm run build` first; it starts `next start` on port 3200). Uses the installed Microsoft Edge (`channel: "msedge"`), so no browser download. `npx playwright test e2e/flows.spec.ts --project=desktop` runs one file.

Unit tests (Vitest + React Testing Library, jsdom) live in `__tests__/`. They use no database: `__tests__/setup.ts` replaces the database-backed `lib/data` modules with sample-data versions in `lib/mock/` (`users-data.ts`, `articles-data.ts`, `session-data.ts`; keep them in step with `lib/data`), so the SQL is covered by `e2e/`. Vitest cannot render `async` Server Components, so pages are covered by `e2e/`: one h1 and no console errors on every route, axe WCAG 2.1 AA checks, key flows, and no horizontal scroll at 375px (`phone` project).

## Stack notes

- Next.js 16.4 App Router with React 19.3. Per AGENTS.md, check `node_modules/next/dist/docs/` (`01-app/` for the App Router) instead of relying on memory.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. With Cache Components on, data fetching and caching follow the `"use cache"` / Suspense model, so look it up in the bundled docs before writing data-loading code.
- Tailwind CSS v4 is loaded through a Turbopack rule (`@tailwindcss/turbopack` loader on `*.css`), not PostCSS. There is no `tailwind.config`: design tokens live in `app/globals.css` under `@theme`, with custom utilities `font-display` (Archivo at width 125, self-hosted subset from `app/fonts/`), `text-meta`, `marquee-track` and `prose-herald` (article HTML).
- Contrast rules from `docs/design.md`: white text only on Academics blue, ink on every other colour; faded decorative text no lighter than `text-ink/50`.
- Layouts and pages use the global generated types `LayoutProps<"/route">` / `PageProps<"/route">` (no import needed).
- Import alias: `@/*` maps to the repo root.

## Domain rules from the spec

These rules shape the data model and access control:

- Roles are `author` and `admin` only. The administrator is also the editor; there is no separate editor role. Readers are anonymous, with no reader accounts.
- Article lifecycle: `draft` → `pending` (author submits) → `published` or `rejected` (admin review, with a `review_note` on rejection). A rejected article is revised and resubmitted. Authors can never publish directly.
- Exactly five fixed categories: Academics, Organisations, Events, Opinion, Achievements (seeded, not user-editable).
- The "most-read" sidebar widget is driven by `articles.view_count`, which goes up each time an article is viewed.
- Author accounts are created by the admin only (no self-registration) and are deactivated with `is_active = false` rather than deleted, so old articles keep their author.
- Article HTML is rendered with `dangerouslySetInnerHTML` (`components/article/article-body.tsx`). Today it is trusted sample data; from Phase 4, HTML written in the editor must be sanitised on the server before it is saved.
- Out of scope: comments, tags (the schema has tables for them, marked as future features), notifications, social auto-posting, multi-language, password-reset email (the admin resets passwords).
- NFRs: pages load in under 3 s on mobile, mobile-first responsive layout, dashboard only reachable when logged in, passwords stored hashed.
