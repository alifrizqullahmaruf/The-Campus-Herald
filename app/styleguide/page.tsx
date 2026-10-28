import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { CategoryPill } from "@/components/ui/category-pill";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts, getMostRead } from "@/lib/data/articles";
import type { ArticleStatus } from "@/lib/types";

// Internal page for reviewing tokens and components (docs/design.md).
// Development only; remove or put behind login in Phase 3.
export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
};

const BASE_COLOURS = [
  { name: "paper", hex: "#F5EFE6", className: "bg-paper text-ink" },
  { name: "surface", hex: "#FFFFFF", className: "bg-surface text-ink" },
  { name: "ink", hex: "#111111", className: "bg-ink text-paper" },
  { name: "ink-muted", hex: "#4A4640", className: "bg-ink-muted text-paper" },
  { name: "accent", hex: "#F477D4", className: "bg-accent text-ink" },
];

const CATEGORY_HEX: Record<string, string> = {
  academics: "#354BF6",
  organisations: "#4AF5A2",
  events: "#F9DE43",
  opinion: "#F04939",
  achievements: "#B28EF8",
};

const TYPE_SCALE = [
  { token: "display-xl", className: "font-display text-[clamp(48px,9vw,112px)] font-black leading-[0.95]" },
  { token: "display-lg", className: "font-display text-[clamp(36px,6vw,72px)] font-black leading-[0.95]" },
  { token: "display-md", className: "font-display text-[clamp(28px,4vw,48px)] font-extrabold leading-none" },
  { token: "display-sm", className: "font-display text-2xl font-extrabold leading-tight" },
];

const STATUSES: ArticleStatus[] = ["draft", "pending", "published", "rejected"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t-3 border-ink py-12">
      <h2 className="mb-6 font-display text-3xl font-black">{title}</h2>
      {children}
    </section>
  );
}

export default async function StyleguidePage() {
  const [counts, mostRead] = await Promise.all([getCategoryCounts(), getMostRead(3)]);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
      <Eyebrow>Internal</Eyebrow>
      <h1 className="mt-3 font-display text-[clamp(36px,6vw,72px)] font-black leading-[0.95]">
        Style guide.
      </h1>
      <p className="mt-4 max-w-xl text-ink-muted">
        Tokens and components from docs/design.md, rendered with sample data.
      </p>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {BASE_COLOURS.map((c) => (
            <div key={c.name} className={`rounded-card border-3 border-ink p-4 shadow-hard ${c.className}`}>
              <p className="font-display text-lg font-extrabold">{c.name}</p>
              <p className="text-meta">{c.hex}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Card key={c.slug} tone={c.slug} className="p-4">
              <p className="font-display text-lg font-extrabold">{c.name}</p>
              <p className="text-meta">{CATEGORY_HEX[c.slug]}</p>
              <p className="mt-2 text-sm">
                {c.textClass === "text-white" ? "White text" : "Ink text"}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-6">
          {TYPE_SCALE.map((t) => (
            <div key={t.token}>
              <p className="text-meta text-ink-muted">{t.token}</p>
              <p className={t.className}>Campus news, loud.</p>
            </div>
          ))}
          <div>
            <p className="text-meta text-ink-muted">body-lg / body</p>
            <p className="max-w-[68ch] text-lg leading-relaxed">
              Body text is set in Geist Sans at 18px for articles and 16px elsewhere. It stays plain
              so the headlines can be loud.
            </p>
          </div>
          <div>
            <p className="text-meta text-ink-muted">meta</p>
            <p className="text-meta">Oct 14, 2026 · 3 min read · 214 articles</p>
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="dark" href="/styleguide" arrow>
            Read the story
          </Button>
          <Button variant="danger">Reject</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Category pills">
        <div className="flex flex-wrap gap-4">
          {CATEGORIES.map((c) => (
            <CategoryPill key={c.slug} slug={c.slug} count={counts[c.slug]} />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <CategoryPill key={c.slug} slug={c.slug} size="sm" />
          ))}
        </div>
      </Section>

      <Section title="Badges and labels">
        <div className="flex flex-wrap items-center gap-4">
          <Eyebrow>This week</Eyebrow>
          {CATEGORIES.map((c) => (
            <CategoryBadge key={c.slug} name={c.name} />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="Cards (sample data: most read)">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mostRead.map((article) => (
            <Card key={article.id} tone={article.category.slug} lift className="flex flex-col p-4">
              <div className="flex items-center justify-between">
                <CategoryBadge name={article.category.name} />
                <span className="text-meta">{article.readingMinutes} min</span>
              </div>
              <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight">
                {article.title}
              </h3>
              <p className="mt-2 line-clamp-2">{article.excerpt}</p>
              <div className="mt-4 flex justify-between border-t-2 border-current/20 pt-2 text-meta">
                <span>{article.author.name}</span>
                <span>{article.viewCount.toLocaleString("en")} reads</span>
              </div>
            </Card>
          ))}
          <Card lift className="p-4">
            <p className="font-display text-2xl font-extrabold">Surface card</p>
            <p className="mt-2 text-ink-muted">Used for widgets, modals and dashboard panels.</p>
          </Card>
        </div>
      </Section>

      <Section title="Loading skeleton">
        <p className="mb-6 max-w-xl text-ink-muted">
          Shown while the article, topic and writer pages stream in after a click. Laid out like the page it stands in for.
        </p>
        <div className="max-w-md">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-2 h-12 w-2/3" />
          <Skeleton className="mt-5 h-5 w-4/5" />
          <Skeleton className="mt-6 aspect-16/9" />
        </div>
      </Section>
    </main>
  );
}
