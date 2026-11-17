import type { CSSProperties } from "react";
import { getCategoryBySlug } from "@/lib/categories";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import type { ArticleWithRelations } from "@/lib/types";

/**
 * Renders the article HTML. It is raw HTML, so it is cleaned here too, not only when it
 * is saved (lib/sanitize-html.ts): that also covers rows written outside the app. This is
 * a Server Component, so the cleaning runs on the server (at build time for the static
 * article pages) and the sanitiser never reaches the browser.
 */
export function ArticleBody({ article }: { article: ArticleWithRelations }) {
  const category = getCategoryBySlug(article.category.slug);
  // Pull quotes take the category colour; Academics (blue) needs white text.
  const style = {
    "--cat-bg": `var(--color-cat-${article.category.slug})`,
    "--cat-fg": category?.textClass === "text-white" ? "#ffffff" : "var(--color-ink)",
  } as CSSProperties;

  return <div className="prose-herald" style={style} dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.body) }} />;
}
