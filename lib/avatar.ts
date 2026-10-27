import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";
import { getCategoryBySlug } from "./categories";
import type { CategorySlug } from "./types";

// Writer avatars: DiceBear "Notionists" (CC0, no attribution needed), generated
// on the server from the writer's name, so the same person always gets the same
// face. Replaced by an uploaded photo once authors can upload one (Phase 4).

const PAPER = "F5EFE6";

// The style picks hair at random from the seed, with no idea whether a name is
// a woman's or a man's. For the sample writers the hair is chosen by hand, by
// user id; face, clothes and colour still come from the name. `beardProbability: 0`
// is a guard only: none of these names draws a beard today. Writers added later
// get the random look until they upload a photo (Phase 4).
type Look = { hair?: notionists.Options["hair"]; beardProbability?: number };
const LOOKS: Record<number, Look> = {
  1: { hair: ["variant63"], beardProbability: 0 }, // Dewi Lestari: hijab
  3: { hair: ["variant23"], beardProbability: 0 }, // Nadia Putri: shoulder-length bob
  5: { hair: ["variant28"], beardProbability: 0 }, // Sekar Ayu: long wavy hair
  6: { hair: ["variant34"] }, // Yoga Firmansyah: short hair
  7: { beardProbability: 0 }, // Laras Wibowo: keeps her own ponytail
};

/** SVG markup of the writer's avatar on their main topic colour. */
export function avatarSvg(seed: string, topic?: CategorySlug | null, userId?: number): string {
  const background = topic ? getCategoryBySlug(topic)?.hex.replace("#", "") : undefined;
  return createAvatar(notionists, {
    seed,
    backgroundColor: [background ?? PAPER],
    ...(userId !== undefined ? LOOKS[userId] : undefined),
  }).toString();
}

