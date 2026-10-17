# Side Notes: Design System

How Side Notes, the community blog of The Campus Herald, looks and behaves. Read this before building any UI. Product scope and rules live in [`the-campus-herald.md`](the-campus-herald.md); this file only covers presentation.

**Visual reference:** the "Crumpet Riot" Framer magazine template (screen recording in `resource_private/`, not in the repo). We borrow its *style*: colour-coded categories, thick ink outlines, hard shadows, loud display type. We do **not** copy its text, photos, illustrations, logo or layout one-to-one.

**Status:** v1.1 (2026-10-16). Rebranded from "The Campus Herald" to "Side Notes". Light theme only; dark mode is deferred until UI/UX research is done.

---

## 0. Brand

The playful, sticker-wall style reads as a community blog, not an official newspaper, so the site has its own name. The client and organisation do not change.

| | |
|---|---|
| **Name** | **Side Notes** |
| **Byline** | "by The Campus Herald" (always next to the name in the logo) |
| **Relationship** | The Campus Herald is the student press society that runs the site; Side Notes is its community blog. Authors are Herald members, and the Herald's administrator is the editor |
| **Tagline** | "The campus, in the margins." |
| **Logo mark** | A page with three lines of text and a yellow sticky note stuck to its margin, tilted, with an ink-and-pink scribble; thick ink outlines and hard shadows. Source artwork: `docs/brand/side-notes-logo-source.jpg`; vector version: `lib/brand-mark.ts` (rendered by `components/layout/logo-mark.tsx`). No letters in the mark |
| **Favicon** | Simplified mark with heavier strokes so it reads at 16–32px (`app/icon.svg`) |
| **Link preview** | `app/opengraph-image.tsx`: mark + name + byline + tagline on paper with a yellow bottom bar |
| **Voice** | Casual, warm, short sentences; still edited ("read by an editor before they go up"). Section titles stay short and end with a full stop |
| **Vocabulary** | Categories are **topics** ("Pick a topic.", "Open the topic ↗"); writing is a **note** or an **article**; people are **writers** or **authors**. Avoid newsroom words such as "desk" and "newsroom" |

Name, byline, tagline and description live in `lib/site.ts`; read them from there instead of typing them.

---

## 1. Principles

1. **Colour means category.** Every article carries its category colour everywhere it appears (card, badge, pill, search result). Readers learn "blue = Academics" without reading a label. Colour is never the *only* signal: the category name is always shown too.
2. **Ink and paper.** Warm off-white paper, near-black ink, 3px outlines, hard offset shadows. No gradients, no blur shadows, no glassmorphism.
3. **Loud headlines, quiet body.** Display type is wide and heavy; body text is plain and readable. Small metadata is set in mono uppercase.
4. **Playful, not noisy.** Tilt and lift on hover, a single marquee, short punchy section titles. One playful element per screen section, not five.
5. **Phone first, light pages.** Most readers are on phones on mobile data (spec NFR: < 3 s). Every decorative effect must be optional and cheap.
6. **Calmer inside the dashboard.** Authors and the admin work in the dashboard for long sessions. Same tokens, less colour, no tilt.

---

## 2. Tokens

### 2.1 Colour

Sampled from the reference recording and rounded.

**Base**

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F5EFE6` | Page background |
| `surface` | `#FFFFFF` | Cards on paper, inputs, modals, pills on colour |
| `ink` | `#111111` | Text, outlines, shadows, dark sections |
| `ink-muted` | `#4A4640` | Secondary text on paper/surface (8.2:1 on paper) |
| `line` | `#111111` at 15% | Hairline dividers inside cards |

**Category**

| Category | Token | Hex | Text on it | Contrast |
|---|---|---|---|---|
| Academics | `cat-academics` | `#354BF6` (blue) | **white** | 6.0:1 |
| Organisations | `cat-organisations` | `#4AF5A2` (green) | ink | 13.4:1 |
| Events | `cat-events` | `#F9DE43` (yellow) | ink | 14.0:1 |
| Opinion | `cat-opinion` | `#F04939` (red) | ink | 5.1:1 |
| Achievements | `cat-achievements` | `#B28EF8` (purple) | ink | 7.3:1 |

**Accent:** `accent` = `#F477D4` (pink, ink text 7.6:1). Used for highlights and one-off stickers, never as a category colour.

**Brand yellow:** `cat-events` yellow doubles as the brand colour for the primary button and the search box. Where a yellow element sits next to Events content, the category name disambiguates it.

**Rules**

- Text on blue is always white. All other colours take ink text. Never put white text on yellow, green, purple or pink.
- Muted text (`ink-muted`) only on `paper` or `surface`, never on category colours. On colour, use ink at full strength.
- Category colours fill cards, pills and section bands. They are not used for body text or links.

**Dashboard status colours** reuse the palette but always pair colour with an icon and a text label, because they overlap with category colours:

| Status | Fill | Icon | Label |
|---|---|---|---|
| `draft` | `surface` + dashed ink outline | pencil | Draft |
| `pending` | `cat-events` yellow | clock | Waiting for review |
| `published` | `cat-organisations` green | check | Published |
| `rejected` | `cat-opinion` red | arrow-back | Needs changes |

### 2.2 Typography

| Role | Family | Settings | Notes |
|---|---|---|---|
| Display (headings, card titles, pills, buttons) | **Archivo** (variable) | `wdth` 125, weight 800–900, tracking −0.02em, line-height 0.95–1.05 | Load via `next/font/google` with `axes: ['wdth']` |
| Body | **Geist Sans** | weight 400/500, line-height 1.6 | Already loaded in `app/layout.tsx` |
| Meta (labels, dates, read time, counts, keyboard hints) | **Geist Mono** | weight 500–700, UPPERCASE, tracking +0.06em, 11–12px | Already loaded |

**Scale** (CSS px; fluid sizes use `clamp`)

| Token | Size | Use |
|---|---|---|
| `display-xl` | clamp(44px, 6.5vw, 84px) | Home hero only (smaller since the longer Side Notes headline) |
| `display-lg` | clamp(36px, 6vw, 72px) | Page and section titles ("Most read.") |
| `display-md` | clamp(28px, 4vw, 48px) | Category card names, article title |
| `display-sm` | 20–24px | Card titles, author names |
| `body-lg` | 18px | Article body, lead paragraph |
| `body` | 16px | Default text, card excerpts (min 15px) |
| `meta` | 11–12px | Mono labels |

Section titles are short and end with a full stop, in sentence case: "Most read.", "Fresh off the notebook.", "Pick a topic."

### 2.3 Shape, border, shadow

| Token | Value | Use |
|---|---|---|
| `border` | 3px solid ink | Cards, buttons, inputs, modals, pills |
| `border-thin` | 2px solid ink | Badges, small chips, inner image frames |
| `radius-card` | 16px | Cards, modals, category tiles |
| `radius-inner` | 10px | Images inside cards |
| `radius-pill` | 999px | Pills, badges, buttons |
| `shadow` | `4px 4px 0 0 ink` | Resting cards, buttons, pills |
| `shadow-lift` | `8px 8px 0 0 ink` | Hover / focus-within |
| `shadow-pressed` | `0 0 0 0 ink` + translate(4px, 4px) | Active (pressed) buttons |

Images inside cards are framed: `border-thin`, `radius-inner`, inset 12px from the card edge.

### 2.4 Spacing and layout

- 4px base unit. Common steps: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Content container: max 1120px, side gutter 16px (phone) / 24px (tablet) / 32px (desktop).
- Section rhythm: 64px vertical padding on phone, 96px on desktop. Full-bleed colour bands separated by a 3px ink rule.
- Breakpoints (Tailwind defaults): `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Grids: article cards 1 col → 2 (`md`) → 3 (`lg`). Category tiles 1 → 2.

### 2.5 Motion

Measured from the template recording (2026-10-17): micro-interactions are quick and ease out; things rest slightly tilted; bounce comes only from physics.

| Name | Effect | Duration | Where |
|---|---|---|---|
| Lift | translate(−4px, −6px), `shadow` → `shadow-lift`, rotate(−2deg) | 150ms ease-out | Cards (`Card lift`) |
| Press | translate(4px, 4px), shadow → 0 | 80ms | Buttons |
| Rank pop | rank number scales 1.25, rotates −6deg, turns ink | 150ms ease-out | Most read rows |
| Filter pop | matches rise 4px, tilt −1deg, shadow-lift; others fade to 30% + grayscale | 200ms ease-out | Search page |
| Line rise | each headline line rises out of a mask, 90ms stagger | 320ms | Home hero |
| Logo wobble | sticky note wobbles from its stuck edge, corner lifts | 1s, once on load and on hover | Logo (`.mark-note`) |
| Marquee | horizontal scroll of latest headlines | ~40s per loop, linear | Under the hero |
| Drifting rows | topic pill rows drift in opposite directions (36 px/s); drag with momentum | continuous | Home "Pick a topic." (`TopicRows`) |
| Physics pile | items drop in, tumble and collide (Matter.js), can be thrown | ~2s to settle | Home hero cards, footer nav pills (`PhysicsPile`) |
| Hero tilt | hero rotates 6deg and lifts as it scrolls out | scroll-linked | Home hero (`hero-tilt`) |
| Pile → grid | latest cards start as a tilted pile and settle into the grid | scroll-linked | Home "Fresh off the notebook." (`pile-card`) |
| Page crossfade | old and new page crossfade; header stays put | 200ms | Public layout (`<ViewTransition>`) |
| Modal | fade + scale 0.98 → 1 | 150ms | Search palette |

Rules:

- **Reduced motion:** everything above stops. Piles show their static tilted rest poses, rows stop drifting (still draggable), scroll-linked effects are off, page changes swap instantly.
- **Drag is optional:** every draggable item is a normal link; a press that moves less than 5px is a click. Keyboard users tab to the links as usual.
- **Performance:** Matter.js (~25 KB gzip) loads only after the page has loaded (hero) or when the pile scrolls into view (footer); simulations pause off screen and in background tabs. Scroll-linked effects are CSS only; browsers without scroll-driven animations show the final layout.
- **Phones:** same behaviour as desktop (user decision). The hero shows 4 cards instead of 6 so the pile fits above the headline. Cards use `touch-action: none` so they can be dragged; scrolling works anywhere else.

---

## 3. Components

### Header
Sticky, `paper` background, 3px ink rule at the bottom. Left: logo mark (page + sticky note, 44px wide) + wordmark "Side Notes" with "by The Campus Herald" beneath. Centre (≥ `md`): Latest · Categories · Authors · About. Right: search field with `⌘K` hint and, in place of the template's Subscribe button, nothing on public pages. Logged-in users see a "Dashboard" button. Phone: logo, search icon, menu icon; menu opens a full-screen sheet.

### Button
Pill shape, `border`, `shadow`, display font 15–16px weight 800, trailing arrow "→" for navigation.
- **Primary:** yellow fill, ink text.
- **Secondary:** surface fill, ink text.
- **Dark:** ink fill, yellow text (used on colour bands).
- **Danger** (dashboard only): red fill, ink text.
Lift on hover, press on active. Minimum touch target 44×44px.

### Eyebrow tag
Small mono uppercase label in a yellow pill with `border-thin`, rotated −3deg, placed above section titles ("THIS WEEK", "NEWEST FIRST"). One per section.

### Category pill
Pill in the category colour, `border` + `shadow`, display font, optional icon on the left and a count bubble (surface circle, mono number) on the right. Links to the category page. Large version on the home "Pick a topic" row; small version (`border-thin`, 12px) as filters in search.

### Category badge
Small surface pill with `border-thin`, mono uppercase category name ("ACADEMICS"). Sits top-left on every article card.

### Article card (standard)
- Fill: category colour; `border`, `radius-card`, `shadow`.
- Top row: category badge (left), read time in mono (right).
- Framed cover image, 4:3.
- Title: display-sm, 2–3 lines max.
- Excerpt: body, 2 lines, clamp.
- Footer: hairline divider, author (mono) left, date (mono) right.
- Hover: lift. Whole card is one link.
- Without a cover image: drop the image frame; the card stays coloured.

### Article card (feature)
Used for the cover story. Surface card on a coloured band, image left / text right on desktop (stacked on phone). Contains category badge, display-md title, excerpt, an optional pull-quote box (surface, `border-thin`), author line and a "Read the story →" dark button.

### Article row (compact)
For Most read and search results: 48px framed thumbnail, title (display 15–16px), mono meta line. Most read rows show a large outlined rank number (01–05) on the right, mono, ink at 20% until hover.

### Most read widget
Client request. Eyebrow "THIS WEEK", title "Most read.", five compact rows ranked by `view_count`. On article and category pages it sits in the sidebar (≥ `lg`) and moves below the content on phone.

### Search
- **Inline box:** yellow card with `border` + `shadow`, title "Lost something? Search the archive.", input, and popular category pills.
- **Command palette (⌘K / Ctrl+K, or the header search icon):** modal with yellow header holding the input and an Esc key chip, a row of category filter pills ("All" + five), result count in mono, compact result rows, and a footer of keyboard hints (↑↓ to move, ↵ to open, Esc to close). Selected row is filled with its category colour. Backdrop: paper at 80% with a faint dot grid.

### Marquee ticker
Ink band under the home hero, scrolling the latest headlines, each prefixed with a small category badge. Pauses on hover and focus. Hidden from screen readers (`aria-hidden`), because the same headlines appear in the "Latest" section.

### Category tile
Large card in the category colour: mono "N articles in the archive" chip top-left, "Open the topic ↗" top-right, category name in display-lg, one-line description. Used on the Categories page.

### Images

- **Article covers:** stock photos from Unsplash for sample articles, chosen per article by search terms in `scripts/fetch-covers.mjs` (`npm run covers`, needs `UNSPLASH_ACCESS_KEY`) and stored in `lib/mock/covers.json`. Photos are hotlinked from Unsplash with its own sizing parameters (custom `next/image` loader) and always show "Photo: Name on Unsplash" with UTM links, as Unsplash requires. Without a photo, the generated `CoverArt` pattern is used. Authors upload their own covers in Phase 4.
- **Writer avatars:** DiceBear "Notionists" (CC0, no attribution), generated from the writer's name on their main topic colour; served as static SVG files from `/avatars/[id]` so they stay out of the HTML. Initials remain the fallback (e.g. accounts added in the preview).

### Author card
Coloured square (author's most-used category colour), the writer's avatar filling the middle, name in a surface pill at the bottom, role in mono at the top ("OPINION WRITER"). Hover or focus flips to a short bio; tap on phone goes straight to the author page. Flip is disabled under reduced motion (show the bio on the author page instead).

### Article page parts
- **Header:** category badge, display-lg title, lead paragraph, author + date + read time in mono, framed cover image.
- **"Filed under" box:** sticky aside (≥ `lg`) with the category name, its description, "More in this category →" and "All articles →".
- **Body:** Geist 18px, max 68ch; h2 in display-sm; lists with ink bullets; images framed.
- **Pull quote:** full-width band in the category colour, display-md text with an oversized opening quote mark.
- **Author box:** surface card with initials avatar, name, short bio, "More from this author →".
- **More in this category:** two standard cards.
- **Prev / next:** two links separated by a 3px rule.

### Section band
Full-bleed background in a category or accent colour with ink rules top and bottom. Use at most one band between two paper sections.

### Footer
Ink background, oversized "SIDE NOTES" wordmark in display font (paper and red), a row of link pills (Latest, Categories, Search, Authors, About), and a mono line: "© 2026 Side Notes · A community blog by The Campus Herald". No draggable links.

### Form controls (dashboard and login)
Inputs: surface, `border`, `radius-inner`, 48px height, mono placeholder. Focus: yellow 3px outline outside the border. Errors: red border + message in ink below with a warning icon. Labels above the field, body font, weight 600.

### Status badge (dashboard)
Pill with `border-thin`, status fill, icon + label (see 2.1). Shown on every article row in the dashboard.

### Empty state
Centred surface card with a tilted eyebrow and one sentence, plus one button ("Write your first article →").

---

## 4. Page layouts

### Public

| Page | Sections, top to bottom |
|---|---|
| **Home** `/` | Header · Hero: display-xl headline with one word highlighted in a blue box, short intro, mini card linking to the newest published article (category badge, title, author) · Marquee · "Pick a topic." category pills · Feature card on a yellow band · "Fresh off the notebook." 3-up card grid + "See every article →" · Two-column: Most read + inline search · Footer |
| **Categories** `/categories` | Title · 5 category tiles (2-col grid, last one spans or centres) · Most read · Footer |
| **Category** `/categories/[slug]` | Coloured header band with category name and description · card grid (newest first) with "Load more" · Most read in sidebar (≥ `lg`) · Footer |
| **Article** `/articles/[slug]` | Article header · body with "Filed under" aside · pull quote band · author box · More in this category · prev/next · Footer. View count increments here. |
| **Search** `/search` | Title "Search the archive." · large search box with category filters · result grid (non-matching cards fade to 30%, matches lift and keep colour) · Footer. The ⌘K palette is available on every page. |
| **Authors** `/authors` | Title · ink band with author cards grid · Footer. Author detail `/authors/[id]`: initials header + their published articles. |
| **About** `/about` | Title · story block with image · "In numbers" band (articles published, authors, categories) · authors teaser · Footer |

### Dashboard (logged-in)

Same tokens, calmer: `paper` background, surface cards, `shadow` only on primary actions, no tilt, no marquee, category colour only on badges.

Shell: left sidebar (≥ `lg`; bottom tab bar on phone) with the logo, nav items, and the signed-in user with a role chip ("AUTHOR" / "ADMIN") and Log out.

| Page | Role | Content |
|---|---|---|
| **Login** `/login` | All | Centred surface card, logo, email + password, primary button. Note: "Forgot your password? Ask the administrator." |
| **My articles** `/dashboard` | Author | Filter tabs by status with counts · table/list of articles: title, category badge, status badge, last updated · "New article" primary button. Rejected rows show the review note preview. |
| **Editor** `/dashboard/articles/[id]` | Author | Title field, category select (5), cover image upload, rich-text editor (headings, bold, italic, bullet and numbered lists, images; nothing more) · sticky action bar: Save draft (secondary), Submit for review (primary). Read-only with a banner while `pending`. Rejected articles show the admin's note in a red-outlined callout above the editor. |
| **Review queue** `/dashboard/review` | Admin | List of `pending` articles, oldest first: title, author, category, submitted time. |
| **Review** `/dashboard/review/[id]` | Admin | Article rendered exactly as it will look publicly · sticky bar: Approve (primary, green-filled confirm) and Reject (danger) which requires a note in a textarea. |
| **All articles** `/dashboard/articles` | Admin | Full table with status and author filters. |
| **Authors** `/dashboard/authors` | Admin | Author list with active/inactive status · Add author (name, email, temporary password) · Deactivate / Reactivate · Reset password. No delete. |

---

## 5. Not taken from the template

These template features are out of scope in the SRS and must not be built. (Draggable hero cards and footer links were listed here until 2026-10-17; they are now built, see 2.5.)

| Template feature | Reason |
|---|---|
| Newsletter sign-up, "Subscribe" button, "One email every Friday" section | No email or push notifications |
| Reader polls ("Pick a side. We keep score.") | No reader accounts or reader interaction |
| Reader letters wall | Equivalent to comments, which are out of scope |
| "Pitch it" form for outside writers | No self-registration; authors are created by the admin |
| Paid-contributor copy, follower counts | Not applicable |
| Issue/binder archive ("Every Friday, filed in a binder") | No issue concept; the archive is browsed by category and search |

---

## 6. Accessibility

- Text contrast meets WCAG AA. See 2.1; white on blue, ink on every other colour.
- Category is always conveyed by text as well as colour.
- Visible focus on every interactive element: 3px yellow outline offset 2px, plus `shadow-lift`. Never remove outlines.
- Tilted elements are decorative only; body text and form fields are never rotated.
- Respect `prefers-reduced-motion` (section 2.5).
- Cover images need `alt` text; the editor asks for it on upload.
- Modal search traps focus, closes on Esc, and returns focus to the trigger.
- Minimum body size 15px on phone; tap targets at least 44px.

## 7. Performance budget

Target from the spec: pages load in under 3 s on a mobile connection.

- Fonts: Archivo (one variable file, `latin` subset, `wdth` + `wght` axes) + Geist Sans + Geist Mono, all through `next/font` (self-hosted, `display: swap`).
- Images: `next/image`, responsive `sizes`, WebP/AVIF, cover images max 1600px wide. Lazy-load everything below the first screen.
- No animation libraries for v1. Hover and marquee are CSS only.
- The ⌘K palette is loaded on demand (dynamic import when first opened).
- Public pages are static or cached (Cache Components); interactive parts are small client islands.

---

## 8. Implementation notes

Tokens go into `app/globals.css` under Tailwind v4's `@theme`, so they become utilities (`bg-paper`, `text-ink`, `bg-cat-academics`, `shadow-hard`, `font-display`).

```css
@theme {
  --color-paper: #f5efe6;
  --color-surface: #ffffff;
  --color-ink: #111111;
  --color-ink-muted: #4a4640;
  --color-accent: #f477d4;

  --color-cat-academics: #354bf6;
  --color-cat-organisations: #4af5a2;
  --color-cat-events: #f9de43;
  --color-cat-opinion: #f04939;
  --color-cat-achievements: #b28ef8;

  --radius-card: 16px;
  --radius-inner: 10px;

  --shadow-hard: 4px 4px 0 0 var(--color-ink);
  --shadow-hard-lift: 8px 8px 0 0 var(--color-ink);

  --font-display: var(--font-archivo);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

Display headings also need `font-stretch: 125%` (or `font-variation-settings: "wdth" 125`) because the width axis is not set by the family alone.

```ts
// app/layout.tsx
import { Archivo } from "next/font/google";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});
```

Keep the category → colour mapping in one place in code (for example a `categories` constant keyed by slug, with name, colour token and text colour) so cards, pills, badges and search all read from it.

Also remove the template leftover `font-family: Arial, Helvetica, sans-serif` from `body` in `app/globals.css`, which currently overrides Geist.

## 9. Open questions

- ~~**UI copy language**~~ Decided 2026-10-15: **English** for all UI copy (menus, buttons, labels, section titles).
- ~~**Logo**~~ Decided 2026-10-16: page-and-sticky-note mark (section 0).
- **Dark mode:** deferred.
- **Home page LCP:** 3.1 s in Lighthouse's simulated slow 4G (other pages 2.8–2.9 s), just over the 3 s target. The largest element is the hero headline waiting for Archivo (90 KB variable font). Options: subset the font to width 125 and weights 800–900 (smaller file, same look), or `display: "optional"` (fast, but the first visit on a slow connection shows the fallback font).

## 10. Implementation notes from Phase 1

Differences between this document and the build, decided while building:

- **Pull quotes** are a coloured block inside the article column rather than a full-bleed band, because they live inside the article HTML.
- **Faded decorative numbers** (Most read ranks, workflow steps) use `ink/50`, not `ink/20`, so large text still meets 3:1 contrast.
- **Category tile names** scale with the tile through a container query so long names ("Organisations") fit half-width tiles.
- **Author cards on the ink band** use paper-coloured outlines and shadows.
- **Section names** in the build: "Pick a topic." (template: shelves), Authors (template: Writers).
