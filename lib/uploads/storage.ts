import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { isUploadPath, UPLOAD_FILE, type UploadExtension } from "./paths";

// Where uploaded cover photos live (Phase 4 day 6, docs/plans/2026-11-17-fase-4-alur-kerja.md):
// a folder outside public/ (`next start` serves only what public/ held at build time), set
// by UPLOADS_DIR and by default .data/uploads in the project (git-ignored). Everything that
// touches the files goes through here, so Phase 5 can move them to Blob or S3 by changing
// this module only. The file calls carry turbopackIgnore: the folder is data written at run
// time, not part of the build, so the build must not trace the project through it.

const TYPES: Record<UploadExtension, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

function folder(): string {
  return resolve(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || join(/*turbopackIgnore: true*/ process.cwd(), ".data", "uploads"));
}

/** The image type the bytes really are (by their first bytes, not the file name), or null. */
export function detectImageType(bytes: Uint8Array): UploadExtension | null {
  const starts = (...values: number[]) => values.every((value, i) => bytes[i] === value);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (starts(0xff, 0xd8, 0xff)) return "jpg";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/** Stores an image under a new random name. Returns its address, "/uploads/<uuid>.<ext>". */
export async function saveUpload(bytes: Uint8Array, type: UploadExtension): Promise<string> {
  const name = `${randomUUID()}.${type}`;
  await mkdir(/*turbopackIgnore: true*/ folder(), { recursive: true });
  await writeFile(join(/*turbopackIgnore: true*/ folder(), name), bytes, { flag: "wx" });
  return `/uploads/${name}`;
}

/** The file with this name and its content type, or null for any other name or a missing file. */
export async function readUpload(name: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const match = UPLOAD_FILE.exec(name);
  if (!match) return null;
  try {
    const bytes = await readFile(join(/*turbopackIgnore: true*/ folder(), name));
    return { bytes, contentType: TYPES[match[1] as UploadExtension] };
  } catch {
    return null;
  }
}

/** Deletes an uploaded file by its address; other addresses and missing files are ignored. */
export async function deleteUpload(src: string): Promise<void> {
  if (!isUploadPath(src)) return;
  await unlink(join(/*turbopackIgnore: true*/ folder(), src.slice("/uploads/".length))).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
