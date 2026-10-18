"use client";

import Image, { type ImageLoaderProps } from "next/image";

/**
 * Picsum resizes and converts its photos itself (`/id/<id>/<w>/<h>.webp`), so
 * this loader asks it for each srcset width at 4:3 instead of using Next's
 * optimiser. `src` is the photo's base URL, `https://picsum.photos/id/<id>`.
 * Covers are capped at 1600px wide (docs/design.md).
 */
export function picsumLoader({ src, width }: ImageLoaderProps): string {
  const w = Math.min(width, 1600);
  return `${src}/${w}/${Math.round((w * 3) / 4)}.webp`;
}

export function PicsumImage({
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
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} loader={picsumLoader} className="object-cover" />;
}
