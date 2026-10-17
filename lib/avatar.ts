import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";
import { getCategoryBySlug } from "./categories";
import type { CategorySlug } from "./types";

// Writer avatars: DiceBear "Notionists" (CC0, no attribution needed), generated
// on the server from the writer's name, so the same person always gets the same
// face. Replaced by an uploaded photo once authors can upload one (Phase 4).

const PAPER = "F5EFE6";

/** SVG markup of the writer's avatar on their main topic colour. */
export function avatarSvg(seed: string, topic?: CategorySlug | null): string {
  const background = topic ? getCategoryBySlug(topic)?.hex.replace("#", "") : undefined;
  return createAvatar(notionists, {
    seed,
    backgroundColor: [background ?? PAPER],
  }).toString();
}

