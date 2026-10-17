import { avatarSrc } from "@/lib/avatar-src";
import { cx } from "@/lib/cx";

/**
 * Writer avatar (DiceBear Notionists, see lib/avatar.ts). Decorative: the name
 * is always shown next to it. Size it with width/height classes.
 */
export function Avatar({ userId, className }: { userId: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static SVG; next/image adds nothing for SVG
    <img
      src={avatarSrc(userId)}
      alt=""
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      className={cx("block object-cover", className)}
    />
  );
}
