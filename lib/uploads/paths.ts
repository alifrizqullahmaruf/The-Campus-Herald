// Addresses of uploaded files (Phase 4 day 6, docs/plans/2026-11-17-fase-4-alur-kerja.md):
// /uploads/<uuid>.<ext>, served by app/uploads/[file]/route.ts. Shared by the browser and
// the server; no server code here.

export const UPLOAD_EXTENSIONS = ["webp", "jpg", "png"] as const;
export type UploadExtension = (typeof UPLOAD_EXTENSIONS)[number];

/** A file name the server made: a random UUID and one of the allowed extensions. */
export const UPLOAD_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/;

/** True for "/uploads/<uuid>.<ext>" and nothing else (no other folder, no "..", no host). */
export function isUploadPath(src: string): boolean {
  return src.startsWith("/uploads/") && UPLOAD_FILE.test(src.slice("/uploads/".length));
}
