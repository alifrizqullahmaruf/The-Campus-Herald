import type { Metadata } from "next";
import { MostRead } from "@/components/article/most-read";
import { CategoryTile } from "@/components/category/category-tile";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { CATEGORIES } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { getCategoryCounts } from "@/lib/data/articles";
import { pileStyle } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Categories",
  description: "Academics, Organisations, Events, Opinion and Achievements: every note in its own topic.",
};

export default async function CategoriesPage() {
  const counts = await getCategoryCounts();
  return (
    <>
      <Container className="py-14 md:py-20">
        <SectionHeader
          as="h1"
          eyebrow="Five topics"
          title="Five topics. Pick one."
          aside="Every note we publish sits in exactly one topic, and every topic has its own colour."
        />
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {CATEGORIES.map((category, i) => {
            // Most tiles are on screen when the page opens, so they all settle on
            // load. An odd last tile spans both columns so the grid stays even;
            // it is already in the middle, so it only drops and tilts into place.
            const last = i === CATEGORIES.length - 1;
            return (
              <li
                key={category.slug}
                data-pile="load"
                className={cx("pile-card flex", last && "md:col-span-2")}
                style={{ ...pileStyle(i, 2), ...(last && { "--px": "0%" }) }}
              >
                <CategoryTile category={category} count={counts[category.slug]} className="w-full" />
              </li>
            );
          })}
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
