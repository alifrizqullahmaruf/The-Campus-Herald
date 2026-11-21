// @vitest-environment node
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type * as CoverActions from "../lib/articles/cover-actions";
import { isUploadPath } from "../lib/uploads/paths";
import { deleteUpload, detectImageType, readUpload, saveUpload } from "../lib/uploads/storage";
import type { User } from "../lib/types";

// Uploaded covers (Phase 4 day 6, docs/plans/2026-11-17-fase-4-alur-kerja.md): the storage
// module in a temporary folder, and the upload action with a fake user.

const state = vi.hoisted(() => ({ user: null as User | null }));
vi.mock("@/lib/auth/current-user", () => ({
  requireUser: async () => {
    if (!state.user) throw new Error("REDIRECT /login");
    return state.user;
  },
}));
const records = vi.hoisted(() => ({
  recordUpload: vi.fn<(ownerId: number, path: string) => Promise<void>>(async () => {}),
  uploadsInLastHour: vi.fn<(ownerId: number) => Promise<number>>(async () => 0),
  removeAbandonedUploads: vi.fn<(ownerId: number) => Promise<void>>(async () => {}),
  UPLOADS_PER_HOUR: 30,
}));
vi.mock("@/lib/data/upload-writes", () => records);
const { uploadCover } = await vi.importActual<typeof CoverActions>("../lib/articles/cover-actions");

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const WEBP = new TextEncoder().encode("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ");
const RAFI: User = { id: 2, name: "Rafi Pratama", email: "rafi@herald.test", role: "author", isActive: true, bio: "", beat: "" };

let folder = "";
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), "side-notes-uploads-"));
  vi.stubEnv("UPLOADS_DIR", folder);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(folder, { recursive: true, force: true });
});
beforeEach(() => {
  state.user = RAFI;
  records.recordUpload.mockClear();
  records.removeAbandonedUploads.mockClear();
});

describe("detectImageType", () => {
  test("knows a photo by its first bytes, not its name", () => {
    expect(detectImageType(PNG)).toBe("png");
    expect(detectImageType(JPEG)).toBe("jpg");
    expect(detectImageType(WEBP)).toBe("webp");
  });

  test("refuses anything else", () => {
    for (const text of ["<svg onload=alert(1)>", "<html>", "GIF89a", "", "RIFF....WAVE"]) {
      expect(detectImageType(new TextEncoder().encode(text)), text).toBeNull();
    }
  });
});

describe("isUploadPath", () => {
  test("only a server-made name in /uploads", () => {
    expect(isUploadPath("/uploads/0f8e3c2a-1b4d-4e5f-9a6b-7c8d9e0f1a2b.webp")).toBe(true);
    for (const src of [
      "/uploads/../.env.local",
      "/uploads/0f8e3c2a-1b4d-4e5f-9a6b-7c8d9e0f1a2b.svg",
      "/uploads/x.png",
      "/covers/0f8e3c2a-1b4d-4e5f-9a6b-7c8d9e0f1a2b.webp",
      "https://evil.test/uploads/0f8e3c2a-1b4d-4e5f-9a6b-7c8d9e0f1a2b.webp",
      "/uploads/0F8E3C2A-1B4D-4E5F-9A6B-7C8D9E0F1A2B.webp",
    ]) {
      expect(isUploadPath(src), src).toBe(false);
    }
  });
});

describe("storage", () => {
  test("saves under a new name, reads it back and deletes it", async () => {
    const src = await saveUpload(PNG, "png");
    expect(isUploadPath(src)).toBe(true);
    const name = src.slice("/uploads/".length);
    const read = await readUpload(name);
    expect(read?.contentType).toBe("image/png");
    expect(Array.from(read!.bytes)).toEqual(Array.from(PNG));
    await deleteUpload(src);
    expect(await readUpload(name)).toBeNull();
    // Deleting again, or something that is not an upload, does nothing.
    await deleteUpload(src);
    await deleteUpload("/covers/1.webp");
  });

  test("a name outside the pattern is never read", async () => {
    expect(await readUpload("../package.json")).toBeNull();
    expect(await readUpload("..%2Fpackage.json")).toBeNull();
  });
});

describe("uploadCover", () => {
  const form = (file: unknown) => {
    const data = new FormData();
    if (file !== undefined) data.set("cover", file as Blob);
    return data;
  };

  test("needs a login", async () => {
    state.user = null;
    await expect(uploadCover(form(new File([PNG], "a.png")))).rejects.toThrow("REDIRECT /login");
  });

  test("a real photo is stored and its address returned", async () => {
    const result = await uploadCover(form(new File([WEBP], "cover.webp", { type: "image/webp" })));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.src).toMatch(/\.webp$/);
    expect(await readdir(folder)).toContain(result.src.slice("/uploads/".length));
    // Recorded as the uploader's, after the uploader's abandoned files were cleared.
    expect(records.recordUpload).toHaveBeenCalledWith(2, result.src);
    expect(records.removeAbandonedUploads).toHaveBeenCalledWith(2);
  });

  test("an account that uploaded too many photos this hour is refused, and nothing is stored", async () => {
    records.uploadsInLastHour.mockResolvedValueOnce(30);
    const before = (await readdir(folder)).length;
    expect(await uploadCover(form(new File([PNG], "a.png")))).toMatchObject({ ok: false, message: expect.stringMatching(/lot of photos/) });
    expect((await readdir(folder)).length).toBe(before);
  });

  test("a file whose record cannot be written is removed again", async () => {
    records.recordUpload.mockRejectedValueOnce(new Error("connection reset"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const before = (await readdir(folder)).length;
    expect((await uploadCover(form(new File([PNG], "a.png")))).ok).toBe(false);
    expect((await readdir(folder)).length).toBe(before);
    log.mockRestore();
  });

  test("no file, an empty one, a large one or one that is not a photo is refused", async () => {
    const before = (await readdir(folder)).length;
    for (const file of [
      undefined,
      "text",
      new File([], "empty.png"),
      new File([new Uint8Array(950_001)], "big.png"),
      new File([new TextEncoder().encode("<svg onload=alert(1)>")], "fake.png", { type: "image/png" }),
    ]) {
      expect((await uploadCover(form(file))).ok).toBe(false);
    }
    expect((await readdir(folder)).length).toBe(before);
  });
});
