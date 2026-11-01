import { Eyebrow } from "@/components/ui/eyebrow";
import { RiseText } from "@/components/ui/rise-text";
import { getMostRead } from "@/lib/data/articles";
import { riseStyle } from "@/lib/motion";
import { ArticleRow } from "./article-row";

/**
 * Client request: the five most-read articles, ranked by view count. As the
 * section scrolls in, the eyebrow pops, the title rises word by word and the
 * rows rise into place (`rise-row`); `riseOnLoad` is for a list already on
 * screen when the page opens from lg (the sticky topic sidebar).
 */
export async function MostRead({ compact, riseOnLoad }: { compact?: boolean; riseOnLoad?: boolean }) {
  const articles = await getMostRead(5);
  return (
    <section aria-labelledby="most-read-title">
      <Eyebrow reveal={riseOnLoad ? "load-lg" : "scroll"}>This week</Eyebrow>
      <h2
        id="most-read-title"
        data-reveal={riseOnLoad ? "load-lg" : undefined}
        className={compact ? "mt-2 font-display text-3xl font-black" : "mt-2 font-display text-[clamp(32px,5vw,56px)] font-black leading-[0.95]"}
      >
        <RiseText text="Most read." on="scroll" />
      </h2>
      <ol className="mt-5 space-y-3">
        {articles.map((article, i) => (
          <li key={article.id} className="rise-row" data-rise={riseOnLoad ? "load-lg" : undefined} style={riseStyle(i)}>
            <ArticleRow article={article} rank={i + 1} showViews />
          </li>
        ))}
      </ol>
    </section>
  );
}
