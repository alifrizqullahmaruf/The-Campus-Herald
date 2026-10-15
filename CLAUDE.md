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

The Campus Herald: an internal news portal for one university's student press society, replacing news sharing over WhatsApp groups and Instagram. The full spec (brief, requirements, SRS scope, diagrams, ER model, PostgreSQL schema) is in `docs/the-campus-herald.md`. Read it before building features. Some of its later sections are written in Indonesian.

The visual design system (colour tokens, category colours, typography, components, page layouts for public pages and the author/admin dashboard, and template features that are out of scope) is in `docs/design.md`. Follow it for any UI work.

`resource_private/` is git-ignored and holds the user's private reference material (e.g. a screen recording of the "Crumpet Riot" Framer template used as UI inspiration). It exists only on the user's machine.

The codebase is still the `create-next-app` scaffold (`app/layout.tsx`, `app/page.tsx`). No backend, database or auth exists yet, and the stack beyond Next.js has not been chosen (spec stages 07–09 are still empty).

## Commands

- `npm run dev`: dev server (Turbopack)
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)

- `npm test`: Vitest in watch mode; `npm test -- --run` runs once, `npx vitest run __tests__/page.test.tsx` runs a single file, `-t "<name>"` filters by test name

Tests use Vitest + React Testing Library with jsdom (`vitest.config.mts`) and live in `__tests__/`. Vitest cannot render `async` Server Components, so cover those with E2E tests instead.

## Stack notes

- Next.js 16.4 App Router with React 19.3. Per AGENTS.md, check `node_modules/next/dist/docs/` (`01-app/` for the App Router) instead of relying on memory.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. With Cache Components on, data fetching and caching follow the `"use cache"` / Suspense model, so look it up in the bundled docs before writing data-loading code.
- Tailwind CSS v4 is loaded through a Turbopack rule (`@tailwindcss/turbopack` loader on `*.css`), not PostCSS. There is no `tailwind.config`: theme tokens live in `app/globals.css` under `@theme inline`.
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
