import type { Metadata } from "next";
import { MostRead } from "@/components/article/most-read";
import { CategoryTile } from "@/components/category/category-tile";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "Categories",
  description: "Academics, Organisations, Events, Opinion and Achievements: every article on its own desk.",
};

export default async function CategoriesPage() {
  const counts = await getCategoryCounts();
  return (
    <>
      <Container className="py-14 md:py-20">
        <SectionHeader
          as="h1"
          eyebrow="Five desks"
          title="Five desks. Pick one."
          aside="Every article we publish sits on exactly one desk, and every desk has its own colour."
        />
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {CATEGORIES.map((category, i) => (
            // An odd last tile spans both columns so the grid stays even.
            <li key={category.slug} className={i === CATEGORIES.length - 1 ? "flex md:col-span-2" : "flex"}>
              <CategoryTile category={category} count={counts[category.slug]} className="w-full" />
            </li>
          ))}
        </ul>
      </Container>
      <div className="border-t-3 border-ink">
        <Container className="max-w-[760px] py-16 md:py-24">
          <MostRead />
        </Container>
      </div>
    </>
  );
}
