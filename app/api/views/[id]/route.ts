import { NextResponse, type NextRequest } from "next/server";
import { isValidId } from "@/lib/data/ids";
import { countView } from "@/lib/data/view-writes";

// One read per browser per article a day (Phase 4 day 7). The article page stays static and
// sends this POST from the browser once it is shown (components/article/view-counter.tsx),
// so prefetches and visitors without JavaScript are not counted. The cookie is scoped to
// this article's path, so it travels with nothing else.

const VIEW_COOKIE = "viewed";
const VIEW_COOKIE_MAX_AGE = 24 * 60 * 60;

export async function POST(request: NextRequest, { params }: RouteContext<"/api/views/[id]">) {
  const raw = (await params).id;
  const id = /^[1-9]\d{0,9}$/.test(raw) ? Number(raw) : NaN;
  if (!isValidId(id)) return new NextResponse(null, { status: 404 });

  // Another site's page cannot count reads in its visitors' browsers.
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return new NextResponse(null, { status: 403 });

  if (request.cookies.has(VIEW_COOKIE)) return new NextResponse(null, { status: 204 });

  let counted: boolean;
  try {
    counted = await countView(id);
  } catch (error) {
    console.error("counting a view failed", error instanceof Error ? error.message : error);
    return new NextResponse(null, { status: 500 });
  }
  if (!counted) return new NextResponse(null, { status: 404 });

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(VIEW_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: `/api/views/${id}`,
    maxAge: VIEW_COOKIE_MAX_AGE,
  });
  return response;
}
