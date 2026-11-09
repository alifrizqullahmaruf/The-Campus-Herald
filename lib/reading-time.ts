const WORDS_PER_MINUTE = 200;

/** Estimated minutes to read an article's HTML body, at least 1. */
export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
