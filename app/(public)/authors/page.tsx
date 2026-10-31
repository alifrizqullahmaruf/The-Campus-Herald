import type { Metadata } from "next";
import { AuthorCard } from "@/components/author/author-card";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { getAuthorProfiles } from "@/lib/data/users";
import { pileStyle } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Authors",
  description: "The Campus Herald members who write for Side Notes.",
};

export default async function AuthorsPage() {
  const authors = await getAuthorProfiles();
  return (
    <>
      <Container className="py-14 md:py-20">
        <SectionHeader
          as="h1"
          eyebrow="The writers"
          title="The people behind the pages."
          aside="Every writer has a favourite topic. Hover or focus a card to flip it; open it to read everything they have written."
        />
      </Container>
      <section aria-label="Authors" className="border-y-3 border-ink bg-ink py-14 md:py-20">
        <Container>
          <ul className="grid gap-4 min-[360px]:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {authors.map((author, i) => (
              // From a pile into the grid, all at once on load like the
              // Categories tiles: a later card waiting for a scroll would rest,
              // pulled up and tilted, over the first row. The flip happens
              // inside the card, so it is unaffected.
              <li key={author.id} className="pile-card" data-pile="load" style={pileStyle(i, 4)}>
                <AuthorCard author={author} onDark />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
