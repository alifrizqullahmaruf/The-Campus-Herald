import { readUpload } from "@/lib/uploads/storage";

// Uploaded cover photos (Phase 4 day 6). Names are random and never reused, so a file can be
// cached for a year; anything that is not one of our names is not found.

export async function GET(_request: Request, { params }: RouteContext<"/uploads/[file]">) {
  const file = await readUpload((await params).file);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
