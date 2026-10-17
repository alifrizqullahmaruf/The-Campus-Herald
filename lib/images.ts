/** True for photos served by Unsplash, which must be hotlinked and credited. */
export function isUnsplash(src: string): boolean {
  return src.startsWith("https://images.unsplash.com/");
}
