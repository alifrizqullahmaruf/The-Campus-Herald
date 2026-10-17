"use client";

import Image, { type ImageLoaderProps } from "next/image";

/**
 * Unsplash asks apps to hotlink its image URLs rather than re-host them, so
 * instead of Next's optimiser this loader asks Unsplash's own image service for
 * the right size and format (responsive srcset still works).
 */
function unsplashLoader({ src, width, quality }: ImageLoaderProps): string {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 70));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  return url.toString();
}

export function UnsplashImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} loader={unsplashLoader} className="object-cover" />
  );
}

