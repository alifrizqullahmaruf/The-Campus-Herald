/** True for photos served by Unsplash, which must be hotlinked and credited. */
export function isUnsplash(src: string): boolean {
  return src.startsWith("https://images.unsplash.com/");
}

/** True for Picsum photos (`https://picsum.photos/id/<id>`), sized by its own URLs. */
export function isPicsum(src: string): boolean {
  return /^https:\/\/picsum\.photos\/id\/\d+$/.test(src);
}

/**
 * True for an absolute https link. Credit links come from data, so anything
 * else (javascript:, data:, plain http) is shown as text instead of a link.
 */
export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
