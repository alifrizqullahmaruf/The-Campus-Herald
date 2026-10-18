import type { CSSProperties } from "react";
import { getCategoryBySlug } from "@/lib/categories";
import type { ArticleWithRelations } from "@/lib/types";

/**
 * Renders the article HTML. Today the body comes from trusted sample data;
 * once authors write it in the editor (Phase 4) it must be sanitised on the
 * server before it is saved (required: this renders it as raw HTML).
 */
export function ArticleBody({ article }: { article: ArticleWithRelations }) {
  const category = getCategoryBySlug(article.category.slug);
  // Pull quotes take the category colour; Academics (blue) needs white text.
  const style = {
    "--cat-bg": `var(--color-cat-${article.category.slug})`,
    "--cat-fg": category?.textClass === "text-white" ? "#ffffff" : "var(--color-ink)",
  } as CSSProperties;

  return <div className="prose-herald" style={style} dangerouslySetInnerHTML={{ __html: article.body }} />;
}
