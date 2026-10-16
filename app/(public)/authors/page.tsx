import type { Metadata } from "next";
import { AuthorCard } from "@/components/author/author-card";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { getAuthorProfiles } from "@/lib/data/users";

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
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {authors.map((author) => (
              <li key={author.id}>
                <AuthorCard author={author} onDark />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
