import { Eyebrow } from "@/components/ui/eyebrow";
import { getMostRead } from "@/lib/data/articles";
import { riseStyle } from "@/lib/motion";
import { ArticleRow } from "./article-row";

/**
 * Client request: the five most-read articles, ranked by view count. The rows
 * rise into place as they scroll in (`rise-row`); `riseOnLoad` is for a list
 * already on screen when the page opens from lg (the sticky topic sidebar).
 */
export async function MostRead({ compact, riseOnLoad }: { compact?: boolean; riseOnLoad?: boolean }) {
  const articles = await getMostRead(5);
  return (
    <section aria-labelledby="most-read-title">
      <Eyebrow>This week</Eyebrow>
      <h2
        id="most-read-title"
        className={compact ? "mt-2 font-display text-3xl font-black" : "mt-2 font-display text-[clamp(32px,5vw,56px)] font-black leading-[0.95]"}
      >
        Most read.
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
