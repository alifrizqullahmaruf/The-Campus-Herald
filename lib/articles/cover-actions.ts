"use server";

import { requireUser } from "../auth/current-user";
import { recordUpload, removeAbandonedUploads, UPLOADS_PER_HOUR, uploadsInLastHour } from "../data/upload-writes";
import { deleteUpload, detectImageType, saveUpload } from "../uploads/storage";
import { MAX_COVER_BYTES } from "./draft-rules";

// Uploading a cover photo (Phase 4 day 6, docs/plans/2026-11-17-fase-4-alur-kerja.md). The
// editor makes the photo smaller first (lib/images-client.ts); this checks it again: a
// logged-in user, a real JPEG, PNG or WebP by its bytes, at most MAX_COVER_BYTES, and at most
// UPLOADS_PER_HOUR uploads an hour. The file is stored and recorded as the user's (only its
// owner's articles may point to it); the article points to it when it is saved. Uploads the
// user abandoned more than a day ago are removed here too.

export type UploadCoverResult = { ok: true; src: string } | { ok: false; message: string };

const NOT_AN_IMAGE = "Choose a JPEG, PNG or WebP photo.";

export async function uploadCover(form: FormData): Promise<UploadCoverResult> {
  const user = await requireUser();
  const file = form instanceof FormData ? form.get("cover") : null;
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: NOT_AN_IMAGE };
  if (file.size > MAX_COVER_BYTES) return { ok: false, message: "That photo is too large even after resizing. Try a smaller one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return { ok: false, message: NOT_AN_IMAGE };
  let src: string | null = null;
  try {
    if ((await uploadsInLastHour(user.id)) >= UPLOADS_PER_HOUR) {
      return { ok: false, message: "That is a lot of photos for one hour. Try again later." };
    }
    await removeAbandonedUploads(user.id);
    src = await saveUpload(bytes, type);
    await recordUpload(user.id, src);
    return { ok: true, src };
  } catch (error) {
    console.error("uploadCover failed", error instanceof Error ? error.message : error);
    // A file without its record could never be used or cleaned up.
    if (src) await deleteUpload(src).catch(() => {});
    return { ok: false, message: "Could not upload the photo. Try again." };
  }
}
