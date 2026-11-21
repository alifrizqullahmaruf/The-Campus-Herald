// Making a cover photo smaller in the browser before it is uploaded (Phase 4 day 6,
// docs/plans/2026-11-17-fase-4-alur-kerja.md): at most 1600×1200, WebP (JPEG where the
// browser cannot write WebP), under MAX_COVER_BYTES so it fits a Server Action. Drawing it on
// a canvas also leaves the camera's EXIF data behind, location included.

import { MAX_COVER_BYTES } from "./articles/draft-rules";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** The photo as a smaller WebP (or JPEG) file, or null when the browser cannot read it. */
export async function shrinkImage(file: File): Promise<File | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    let blob = await toBlob(canvas, "image/webp", quality);
    // A browser that cannot write WebP returns PNG instead; JPEG is smaller then.
    if (blob && blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
    if (blob && blob.size <= MAX_COVER_BYTES) {
      const extension = blob.type === "image/webp" ? "webp" : "jpg";
      return new File([blob], `cover.${extension}`, { type: blob.type });
    }
  }
  return null;
}
