import type { CSSProperties } from "react";
import { ArticleCard } from "@/components/article/article-card";
import { FeatureCard } from "@/components/article/feature-card";
import { MostRead } from "@/components/article/most-read";
import { EditorSticker, HeroNoteCard, PillSticker } from "@/components/home/hero-note-card";
import { TopicRows } from "@/components/home/topic-rows";
import { Container } from "@/components/layout/container";
import { Marquee } from "@/components/layout/marquee";
import { SectionBand } from "@/components/layout/section-band";
import { SectionHeader } from "@/components/layout/section-header";
import { PhysicsPile, type PileItem } from "@/components/physics/physics-pile";
import { SearchBox } from "@/components/search/search-box";
import { Button } from "@/components/ui/button";
import { CategoryPill } from "@/components/ui/category-pill";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts, getPublishedArticles } from "@/lib/data/articles";
import { cx } from "@/lib/cx";
import { seeded } from "@/lib/motion";

// Where hero items rest before (or without) physics: spread across the space
// above the headline, each tilted (template: cards piled on the headline).
const HERO_REST = [
  { left: 14, top: 16 },
  { left: 36, top: 10 },
  { left: 58, top: 18 },
  { left: 80, top: 11 },
  { left: 26, top: 31 },
  { left: 68, top: 30 },
  { left: 90, top: 30 },
  { left: 47, top: 32 },
];

const HEADLINE = ["The campus,", "written in the"];

export default async function Home() {
  const [latest, counts] = await Promise.all([getPublishedArticles({ limit: 10 }), getCategoryCounts()]);
  // Cover story: the most-read of the recent articles.
  const feature = [...latest.slice(0, 5)].sort((a, b) => b.viewCount - a.viewCount)[0];
  const fresh = latest.filter((article) => article.id !== feature.id).slice(0, 6);

  const heroItems: PileItem[] = [
    // Phones get four cards so the pile fits above the headline.
    ...latest.slice(0, 6).map((article, i) => ({
      key: article.id,
      node: <HeroNoteCard article={article} />,
      // --rest-pad: half the tilted card's width per breakpoint, keeps its rest pose on screen.
      className: cx("[--rest-pad:92px] sm:[--rest-pad:110px] md:[--rest-pad:128px]", i >= 4 && "max-sm:hidden"),
    })),
    { key: "editor", node: <EditorSticker />, shape: "circle" as const, decorative: true, className: "[--rest-pad:52px]" },
    {
      key: "topics",
      node: <PillSticker className="bg-cat-organisations">5 TOPICS</PillSticker>,
      decorative: true,
      className: "[--rest-pad:60px]",
    },
  ].map((item, i) => ({ ...item, rest: { ...HERO_REST[i], rotate: Math.round(seeded(i + 1) * 40 - 20) } }));

  const pills = CATEGORIES.map((category) => (
    <CategoryPill key={category.slug} slug={category.slug} count={counts[category.slug]} />
  ));

  return (
    <>
      {/* Hero: articles drop onto the headline and can be thrown around. */}
      <section className="overflow-x-clip">
        <div className="hero-tilt">
          <PhysicsPile items={heroItems} list="Latest notes" className="mx-auto min-h-150 w-full max-w-[1120px] md:min-h-170">
            <Container className="pointer-events-none flex min-h-150 flex-col justify-end pt-72 pb-14 md:min-h-170 md:pb-20">
              <h1 className="font-display text-[clamp(44px,6.5vw,84px)] leading-[0.95] font-black">
                {HEADLINE.map((line, i) => (
                  <span key={line} className="block overflow-hidden pr-3 pb-1">
                    <span className="reveal-line" style={{ "--line": i } as CSSProperties} data-physics-obstacle>
                      {line}
                    </span>
                  </span>
                ))}
                {/* nowrap keeps the full stop with the highlighted word */}
                <span className="block overflow-hidden pt-1 pr-3 pb-3">
                  <span className="reveal-line whitespace-nowrap" style={{ "--line": 2 } as CSSProperties} data-physics-obstacle>
                    <span className="inline-block -rotate-2 rounded-xl border-3 border-ink bg-cat-academics px-3 text-white shadow-hard">
                      margins
                    </span>
                    .
                  </span>
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-ink-muted" data-physics-obstacle>
                Stories, opinions and small wins from students, written by The Campus Herald community and read by an
                editor before they go up. Grab a card and throw it.
              </p>
            </Container>
          </PhysicsPile>
          <Marquee articles={latest.slice(0, 8)} />
        </div>
      </section>

      {/* Topics: rows drift in opposite directions and can be dragged. */}
      <div className="overflow-x-clip">
        <Container className="py-16 md:py-24">
          <SectionHeader
            eyebrow="Five topics"
            title="Pick a topic."
            aside="Every note lives in one of five topics, each with its own colour. Grab a row and drag it, or tap a topic."
          />
        </Container>
        {/* Full-bleed rows, edge to edge like the template. */}
        <div className="-mt-6 pb-16 md:-mt-10 md:pb-24">
          <TopicRows label="Topics" rows={[pills, [...pills].reverse()]} />
        </div>
      </div>

      {/* Cover story */}
      <SectionBand className="bg-cat-events">
        <Container>
          <h2 className="sr-only">Cover story</h2>
          <FeatureCard article={feature} />
        </Container>
      </SectionBand>

      {/* Latest: starts as a tilted pile and settles into the grid on scroll. */}
      <Container className="py-16 md:py-24">
        <SectionHeader
          eyebrow="Newest first"
          title="Fresh off the notebook."
          aside={
            <Button href="/search" variant="secondary" arrow>
              See every article
            </Button>
          }
        />
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fresh.map((article, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const pile = {
              // Toward the middle of the 3-column grid (used from lg up, see globals.css).
              "--px": `${(1 - col) * 100 + Math.round(seeded(i + 11) * 20 - 10)}%`,
              "--py": `${(row === 0 ? 1 : -1) * 45}%`,
              "--pr": `${Math.round(seeded(i + 21) * 30 - 15)}deg`,
            } as CSSProperties;
            return (
              <li key={article.id} className="pile-card flex" style={pile}>
                <ArticleCard article={article} className="w-full" />
              </li>
            );
          })}
        </ul>
      </Container>

      {/* Most read + search */}
      <div className="border-t-3 border-ink">
        <Container className="grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_380px] lg:items-start">
          <MostRead />
          <SearchBox />
        </Container>
      </div>
    </>
  );
}
