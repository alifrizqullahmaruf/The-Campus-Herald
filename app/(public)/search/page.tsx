import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { SearchExplorer } from "@/components/search/search-explorer";
import { getPublishedArticles } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every note published on Side Notes.",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// searchParams is request-time data; reading it inside Suspense keeps the
// heading in the static shell (Cache Components).
async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const params = await searchParams;
  const articles = await getPublishedArticles();
  // The body is not needed in the browser.
  const light = articles.map((article) => ({ ...article, body: "" }));
  return (
    // Keyed by the URL: arriving from the palette while already on /search must
    // not keep the previous query in the explorer's state.
    <SearchExplorer
      key={`${first(params.q)}|${first(params.category)}`}
      articles={light}
      initialQuery={first(params.q)}
      initialCategory={first(params.category)}
    />
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Container className="py-14 md:py-20">
      <SectionHeader
        as="h1"
        eyebrow="Find anything"
        title="Search the archive."
        aside="Type a word or pick a topic. Press ⌘K (Ctrl+K) on any page to search from anywhere."
      />
      <Suspense
        fallback={
          // At least a screen tall, like the results (every article is listed):
          // otherwise the footer shows for a moment and jumps down, and its
          // pile of links starts falling while it is on screen.
          <div className="mt-8 min-h-svh">
            <div className="h-40 animate-pulse rounded-card border-3 border-ink bg-cat-events/50" />
          </div>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
