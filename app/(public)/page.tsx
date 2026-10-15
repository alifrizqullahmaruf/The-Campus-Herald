import Link from "next/link";
import { ArticleCard } from "@/components/article/article-card";
import { FeatureCard } from "@/components/article/feature-card";
import { MostRead } from "@/components/article/most-read";
import { Container } from "@/components/layout/container";
import { Marquee } from "@/components/layout/marquee";
import { SectionBand } from "@/components/layout/section-band";
import { SectionHeader } from "@/components/layout/section-header";
import { SearchBox } from "@/components/search/search-box";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { CategoryPill } from "@/components/ui/category-pill";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts, getPublishedArticles } from "@/lib/data/articles";
import { formatDate } from "@/lib/format";

export default async function Home() {
  const [latest, counts] = await Promise.all([
    getPublishedArticles({ limit: 10 }),
    getCategoryCounts(),
  ]);
  const [newest] = latest;
  // Cover story: the most-read of the recent articles.
  const feature = [...latest.slice(0, 5)].sort((a, b) => b.viewCount - a.viewCount)[0];
  const fresh = latest.filter((article) => article.id !== feature.id).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Container className="grid gap-10 py-14 md:py-20 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <h1 className="font-display text-[clamp(48px,9vw,112px)] font-black leading-[0.95]">
              Campus news,{" "}
              <span className="inline-block -rotate-2 rounded-xl border-3 border-ink bg-cat-academics px-3 text-white shadow-hard">
                loud
              </span>{" "}
              and clear.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ink-muted">
              Written by the student press, checked by an editor before it goes live, and sorted into five
              desks so you can find it again next week.
            </p>
          </div>

          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute -top-6 -right-2 z-10 grid size-20 rotate-12 place-items-center rounded-full border-3 border-ink bg-accent text-center font-display text-[11px] font-black leading-tight shadow-hard"
            >
              EDITOR
              <br />
              CHECKED
            </span>
            <div className="relative rotate-2 rounded-card border-3 border-ink bg-surface p-4 shadow-hard transition-[rotate] hover:rotate-0">
              <p className="text-meta text-ink-muted">Just published</p>
              <div className="mt-3">
                <CategoryBadge name={newest.category.name} />
              </div>
              <p className="mt-2 font-display text-xl font-extrabold leading-tight">
                <Link href={`/articles/${newest.slug}`} className="after:absolute after:inset-0">
                  {newest.title}
                </Link>
              </p>
              <p className="mt-3 text-meta">
                {newest.author.name} · {formatDate(newest.publishedAt)}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Marquee articles={latest.slice(0, 8)} />

      {/* Categories */}
      <Container className="py-16 md:py-24">
        <SectionHeader
          eyebrow="Five desks"
          title="Pick a desk."
          aside="Every article lives on one of five desks, each with its own colour. Tap one to see everything on it."
        />
        <ul className="mt-10 flex flex-wrap gap-4">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <CategoryPill slug={category.slug} count={counts[category.slug]} />
            </li>
          ))}
        </ul>
      </Container>

      {/* Cover story */}
      <SectionBand className="bg-cat-events">
        <Container>
          <h2 className="sr-only">Cover story</h2>
          <FeatureCard article={feature} />
        </Container>
      </SectionBand>

      {/* Latest */}
      <Container className="py-16 md:py-24">
        <SectionHeader
          eyebrow="Newest first"
          title="Fresh from the newsroom."
          aside={
            <Button href="/search" variant="secondary" arrow>
              See every article
            </Button>
          }
        />
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fresh.map((article) => (
            <li key={article.id} className="flex">
              <ArticleCard article={article} className="w-full" />
            </li>
          ))}
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
