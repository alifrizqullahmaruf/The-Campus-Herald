/**
 * The home page's cover story: the most-read of the five newest articles, the newer one
 * on a tie. `views` comes from getViewCounts(), refreshed hourly like Most read, so the
 * two never disagree for long; an article missing from it falls back to its own count.
 */
export function pickFeature<T extends { id: number; viewCount: number }>(
  latest: readonly T[],
  views: Readonly<Record<number, number>>,
): T | undefined {
  let best: T | undefined;
  for (const article of latest.slice(0, 5)) {
    const count = views[article.id] ?? article.viewCount;
    if (best === undefined || count > (views[best.id] ?? best.viewCount)) best = article;
  }
  return best;
}
