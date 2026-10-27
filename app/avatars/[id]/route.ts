import { avatarSvg } from "@/lib/avatar";
import { getAllUsers, getAuthorProfile } from "@/lib/data/users";

// Writer avatars as SVG files: prerendered once, cached by the browser, and
// kept out of the HTML (each is ~13 KB). See lib/avatar.ts.

export async function generateStaticParams() {
  const users = await getAllUsers();
  return users.map((user) => ({ id: String(user.id) }));
}

async function renderAvatar(id: Promise<string>): Promise<string | null> {
  "use cache";
  const userId = Number(await id);
  const user = (await getAllUsers()).find((u) => u.id === userId);
  if (!user) return null;
  const profile = user.role === "author" ? await getAuthorProfile(user.id) : null;
  return avatarSvg(user.name, profile?.primaryCategory, user.id);
}

export async function GET(_request: Request, { params }: RouteContext<"/avatars/[id]">) {
  const svg = await renderAvatar(params.then((p) => p.id));
  if (!svg) return new Response("Not found", { status: 404 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
