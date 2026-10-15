import { Marquee } from "@/components/layout/marquee";
import { getPublishedArticles } from "@/lib/data/articles";

// Temporary home page; rebuilt in M3.
export default async function Home() {
  const latest = await getPublishedArticles({ limit: 8 });
  return (
    <>
      <section className="flex flex-col items-center px-4 py-24 text-center">
        <h1 className="font-display text-[clamp(48px,9vw,112px)] font-black leading-[0.95]">
          The Campus Herald
        </h1>
        <p className="mt-4 max-w-md text-lg text-ink-muted">
          Campus news from the student press, organised in one place.
        </p>
      </section>
      <Marquee articles={latest} />
    </>
  );
}
