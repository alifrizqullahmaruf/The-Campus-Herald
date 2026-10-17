import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GET as avatarRoute } from "../app/avatars/[id]/route";
import { ArticleCover } from "../components/article/article-cover";
import { PhysicsPile } from "../components/physics/physics-pile";
import { avatarSvg } from "../lib/avatar";
import { avatarSrc } from "../lib/avatar-src";
import { getArticleBySlug } from "../lib/data/articles";
import { isUnsplash } from "../lib/images";
import { isDrag, seeded, wrapOffset } from "../lib/motion";

afterEach(cleanup);

describe("motion helpers", () => {
  test("a press becomes a drag after 5px", () => {
    expect(isDrag(3, 3)).toBe(false);
    expect(isDrag(4, 3)).toBe(true);
  });

  test("looping offset stays within one period", () => {
    expect(wrapOffset(0, 100)).toBe(0);
    expect(wrapOffset(-130, 100)).toBe(-30);
    expect(wrapOffset(30, 100)).toBe(-70);
    expect(wrapOffset(-250, 100)).toBe(-50);
    expect(wrapOffset(5, 0)).toBe(0);
  });

  test("seeded randomness is stable and within [0, 1)", () => {
    expect(seeded(3)).toBe(seeded(3));
    for (let i = 0; i < 50; i++) {
      expect(seeded(i)).toBeGreaterThanOrEqual(0);
      expect(seeded(i)).toBeLessThan(1);
    }
  });
});

describe("PhysicsPile", () => {
  test("renders items at their rest pose, as a named list, and decorative items hidden", () => {
    const { container } = render(
      <PhysicsPile
        list="Latest notes"
        items={[
          { key: 1, node: <a href="/a">A</a>, rest: { left: 10, top: 20, rotate: -5 } },
          { key: 2, node: <span>Sticker</span>, rest: { left: 50, top: 30, rotate: 8 }, decorative: true },
        ]}
      />,
    );
    // jsdom has no IntersectionObserver, so the pile stays static.
    expect(container.querySelector("[data-physics]")?.getAttribute("data-physics")).toBe("static");
    expect(screen.getByRole("list", { name: "Latest notes" })).toBeDefined();
    const items = container.querySelectorAll<HTMLElement>("[data-body]");
    expect(items[0].style.getPropertyValue("--rest-left")).toBe("10%");
    expect(items[0].style.getPropertyValue("--rest-rotate")).toBe("-5deg");
    expect(items[1].getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByRole("link", { name: "A" })).toBeDefined();
  });
});

describe("avatars", () => {
  test("same name gives the same avatar; topic colour is the background", () => {
    const a = avatarSvg("Sekar Ayu", "opinion");
    expect(a).toBe(avatarSvg("Sekar Ayu", "opinion"));
    expect(a).toContain("<svg");
    expect(a.toLowerCase()).toContain("f04939");
    expect(avatarSvg("Rafi Pratama", "academics")).not.toBe(a);
  });

  test("route serves SVG for known users and 404 otherwise", async () => {
    expect(avatarSrc(5)).toBe("/avatars/5");
    const ok = await avatarRoute(new Request("http://test/avatars/5"), { params: Promise.resolve({ id: "5" }) });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await ok.text()).toContain("<svg");
    const missing = await avatarRoute(new Request("http://test/avatars/99"), { params: Promise.resolve({ id: "99" }) });
    expect(missing.status).toBe(404);
  });
});

describe("cover photos", () => {
  test("Unsplash photos are recognised", () => {
    expect(isUnsplash("https://images.unsplash.com/photo-1?ixid=x")).toBe(true);
    expect(isUnsplash("/uploads/cover.jpg")).toBe(false);
  });

  test("a stock photo shows the photographer credit with links", async () => {
    const article = (await getArticleBySlug("the-canteen-queue-is-a-design-problem-not-a-patience-problem"))!;
    const { container } = render(
      <ArticleCover
        article={{
          ...article,
          coverImage: "https://images.unsplash.com/photo-123?ixid=abc",
          coverCredit: {
            name: "Ana Lee",
            profileUrl: "https://unsplash.com/@ana?utm_source=side_notes&utm_medium=referral",
            photoUrl: "https://unsplash.com/photos/123?utm_source=side_notes&utm_medium=referral",
            source: "Unsplash",
          },
        }}
      />,
    );
    expect(screen.getByRole("link", { name: "Ana Lee" }).getAttribute("href")).toContain("utm_medium=referral");
    expect(screen.getByRole("link", { name: "Unsplash" })).toBeDefined();
    // Hotlinked with Unsplash's own sizing parameters (decorative, so alt="" and no img role).
    expect(container.querySelector("img")?.getAttribute("src")).toMatch(/^https:\/\/images\.unsplash\.com\/photo-123\?.*w=\d+/);
  });

  test("without a photo the generated art is used and there is no credit", async () => {
    const article = (await getArticleBySlug("the-canteen-queue-is-a-design-problem-not-a-patience-problem"))!;
    const { container } = render(<ArticleCover article={{ ...article, coverImage: null, coverCredit: null }} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText(/Photo:/)).toBeNull();
  });
});
