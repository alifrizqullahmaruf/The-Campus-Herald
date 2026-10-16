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
4. **Debug and verify.** Afterwards, check the whole change: run `npm test -- --run`, `npm run lint` and `npm run build`, and run the app if relevant. Then update the plan file with what was actually done, what changed from the plan, and the verification results.
5. **Tidy the plan file.** Finally, restructure the plan file so it reads cleanly: goal, task table with final status, changed files, verification results, open follow-ups.

### Git

- Commit only after the user confirms. Every commit is pushed to `origin` right after it is created (`git push`); no separate confirmation is needed for the push.
- Commits are authored by the user only (their git identity). Do not add `Co-Authored-By: Claude` or any other Claude/AI attribution to commit messages or PR descriptions.

## Project

**Side Notes**, the community blog of **The Campus Herald** (one university's student press society), replacing news sharing over WhatsApp groups and Instagram. The spec and the client are "The Campus Herald"; the site's brand is "Side Notes · by The Campus Herald" (see `docs/design.md` section 0, and `lib/site.ts` for the name, tagline and description). UI copy calls categories "topics", not "desks". The full spec (brief, requirements, SRS scope, diagrams, ER model, PostgreSQL schema) is in `docs/the-campus-herald.md`. Read it before building features. Some of its later sections are written in Indonesian.

The visual design system (colour tokens, category colours, typography, components, page layouts for public pages and the author/admin dashboard, and template features that are out of scope) is in `docs/design.md`. Follow it for any UI work.

`resource_private/` is git-ignored and holds the user's private reference material (e.g. a screen recording of the "Crumpet Riot" Framer template used as UI inspiration). It exists only on the user's machine.

Progress is tracked in `docs/plans/2026-10-15-roadmap.md`. Phase 1 (design with sample data) is done: every public page and the author/admin dashboard are built, but there is **no database, login or saving yet**. Phases 2–5 (database, auth, workflow, release) are to be brainstormed with the user before any work starts.

## Architecture

- `app/(public)/`: reader-facing pages sharing a header/footer layout (`/`, `/categories/[slug]`, `/articles/[slug]`, `/search`, `/authors/[id]`, `/about`). The layout also mounts the ⌘K palette listener.
- `app/dashboard/`: author pages (`/dashboard`, `/dashboard/articles/new|[id]`) and admin pages (`/dashboard/review`, `/dashboard/articles`, `/dashboard/authors`) in a sidebar shell. `app/login/` stands alone. All dashboard UI is a preview: buttons change client state only, and `lib/mock/session.ts` picks the preview user (Rafi as author, Dewi as admin).
- `app/api/search/route.ts`: JSON search used by the palette.
- `lib/data/*`: **the only way pages read data.** These functions are async and currently read `lib/mock/*`; Phase 2 replaces their bodies with database queries while keeping their signatures. Public functions return published articles only.
- `lib/types.ts` mirrors the stage 06 schema (plus `excerpt`, `createdAt`, `bio`, `beat`, which the schema still needs). `lib/categories.ts` is the single category → colour mapping; use it instead of hard-coding colours. `lib/search.ts` holds the one matching rule shared by server and browser.
- `components/ui` (Button, Card, pills, badges), `components/layout`, `components/article`, `components/search`, `components/author`, `components/dashboard`, `components/editor` (Tiptap).
- Dynamic routes prerender via `generateStaticParams` (Cache Components requires at least one param; `dynamicParams` is unavailable). Unknown params call `notFound()`, which streams the 404 UI with HTTP 200.
- Tiptap must stay client-only (`next/dynamic` with `ssr: false`): it calls `Math.random()` while initialising, which prerendering rejects.
- `/styleguide` is an internal, noindex page showing every token and component.

## Commands

- `npm run dev`: dev server (Turbopack). If new Tailwind classes do not show up, restart it.
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)
- `npm test`: Vitest in watch mode; `npm test -- --run` runs once, `npx vitest run __tests__/search.test.tsx` runs a single file, `-t "<name>"` filters by test name
- `npm run test:e2e`: Playwright against a production build (run `npm run build` first; it starts `next start` on port 3200). Uses the installed Microsoft Edge (`channel: "msedge"`), so no browser download. `npx playwright test e2e/flows.spec.ts --project=desktop` runs one file.

Unit tests (Vitest + React Testing Library, jsdom) live in `__tests__/`. Vitest cannot render `async` Server Components, so pages are covered by `e2e/`: one h1 and no console errors on every route, axe WCAG 2.1 AA checks, key flows, and no horizontal scroll at 375px (`phone` project).

## Stack notes

- Next.js 16.4 App Router with React 19.3. Per AGENTS.md, check `node_modules/next/dist/docs/` (`01-app/` for the App Router) instead of relying on memory.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. With Cache Components on, data fetching and caching follow the `"use cache"` / Suspense model, so look it up in the bundled docs before writing data-loading code.
- Tailwind CSS v4 is loaded through a Turbopack rule (`@tailwindcss/turbopack` loader on `*.css`), not PostCSS. There is no `tailwind.config`: design tokens live in `app/globals.css` under `@theme`, with custom utilities `font-display` (Archivo at width 125), `text-meta`, `marquee-track` and `prose-herald` (article HTML).
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
- Out of scope: comments, tags (the schema has tables for them, marked as future features), notifications, social auto-posting, multi-language, password-reset email (the admin resets passwords).
- NFRs: pages load in under 3 s on mobile, mobile-first responsive layout, dashboard only reachable when logged in, passwords stored hashed.
