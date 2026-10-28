import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GET as avatarRoute } from "../app/avatars/[id]/route";
import { BuriedNotesArt } from "../components/about/buried-notes-art";
import { CountUp } from "../components/about/count-up";
import { existsSync } from "node:fs";
import { ArticleCover } from "../components/article/article-cover";
import { PhysicsPile } from "../components/physics/physics-pile";
import { RiseText } from "../components/ui/rise-text";
import { avatarSvg } from "../lib/avatar";
import { avatarSrc } from "../lib/avatar-src";
import { getArticleBySlug } from "../lib/data/articles";
import { isHttpsUrl, isUnsplash } from "../lib/images";
import { isDrag, pileStyle, seeded, toLocal, wrapOffset } from "../lib/motion";

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

  test("viewport points map back into a tilted element", () => {
    // Untransformed element at (40, 60): a plain offset.
    expect(toLocal({ x: 90, y: 70 }, { x: 40, y: 60 }, { x: 140, y: 60 }, { x: 40, y: 160 })).toEqual({ x: 50, y: 10 });
    // Rotated 6deg about its origin at (40, 60), as the hero tilt does.
    const r = (6 * Math.PI) / 180;
    const at = (x: number, y: number) => ({ x: 40 + x * Math.cos(r) - y * Math.sin(r), y: 60 + x * Math.sin(r) + y * Math.cos(r) });
    const p = toLocal(at(250, 120), at(0, 0), at(100, 0), at(0, 100));
    expect(p.x).toBeCloseTo(250);
    expect(p.y).toBeCloseTo(120);
  });

  test("seeded randomness is stable and within [0, 1)", () => {
    expect(seeded(3)).toBe(seeded(3));
    for (let i = 0; i < 50; i++) {
      expect(seeded(i)).toBeGreaterThanOrEqual(0);
      expect(seeded(i)).toBeLessThan(1);
    }
  });

  test("pile start poses pull toward the middle column and the next row", () => {
    const pose = (i: number, columns: number) => pileStyle(i, columns) as Record<string, string>;
    const px = (i: number, columns: number) => parseFloat(pose(i, columns)["--px"]);
    // Three columns: the middle card barely moves sideways, the outer ones move a column in.
    expect(Math.abs(px(1, 3))).toBeLessThanOrEqual(10);
    expect(px(0, 3)).toBeGreaterThanOrEqual(90);
    expect(px(2, 3)).toBeLessThanOrEqual(-90);
    // Two columns: half a column each way.
    expect(px(0, 2)).toBeGreaterThanOrEqual(40);
    expect(px(0, 2)).toBeLessThanOrEqual(60);
    expect(px(1, 2)).toBeGreaterThanOrEqual(-60);
    expect(px(1, 2)).toBeLessThanOrEqual(-40);
    // The first row drops toward the second, later rows rise; tilts stay within 15deg.
    expect(pose(0, 3)["--py"]).toBe("45%");
    expect(pose(3, 3)["--py"]).toBe("-45%");
    for (let i = 0; i < 9; i++) expect(Math.abs(parseFloat(pose(i, 3)["--pr"]))).toBeLessThanOrEqual(15);
    expect(pileStyle(4, 2)).toEqual(pileStyle(4, 2));
    // Cards that settle on load go one after another.
    expect(pose(2, 3)["--pile-i"]).toBe(2);
  });
});

describe("page title and number motion", () => {
  test("RiseText keeps the title as plain text, one rising span per word", () => {
    const { container } = render(
      <h1>
        <RiseText text="Group chats bury the news." />
      </h1>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Group chats bury the news." })).toBeDefined();
    expect(container.querySelector("h1")?.textContent).toBe("Group chats bury the news.");
    const words = container.querySelectorAll<HTMLElement>(".reveal-line");
    expect(words).toHaveLength(5);
    // 30 ms apart (a third of the 90 ms step) ...
    expect(words[3].style.getPropertyValue("--line")).toBe("1");
    cleanup();
    // ... and never more than 360 ms for long titles.
    const { container: long } = render(<RiseText text={Array.from({ length: 20 }, (_, i) => `w${i}`).join(" ")} />);
    expect([...long.querySelectorAll<HTMLElement>(".reveal-line")].at(-1)?.style.getPropertyValue("--line")).toBe("4");
  });

  test("CountUp shows the final number without the browser APIs, and always to screen readers", () => {
    // jsdom has no IntersectionObserver, as in browsers that cannot animate it.
    const { container } = render(<CountUp value={18} />);
    expect(container.querySelector("[aria-hidden='true']")?.textContent).toBe("18");
    expect(container.querySelector(".sr-only")?.textContent).toBe("18");
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
    // Three hidden probes let the drag code undo an ancestor's tilt.
    expect(container.querySelectorAll("[data-physics-probe]")).toHaveLength(3);
  });
});

describe("About illustration", () => {
  test("is decorative SVG art with no text and no external images", () => {
    const { container } = render(<BuriedNotesArt />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.textContent).toBe("");
    expect(svg.querySelector("image, text")).toBeNull();
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

  test("sample writers with a hand-picked look get it; others keep their random one", async () => {
    // Sekar Ayu (id 5) has hand-picked hair, so her avatar differs from the random pick.
    expect(avatarSvg("Sekar Ayu", "opinion", 5)).not.toBe(avatarSvg("Sekar Ayu", "opinion"));
    // Rafi Pratama (id 2) has no override: the user id changes nothing.
    expect(avatarSvg("Rafi Pratama", "academics", 2)).toBe(avatarSvg("Rafi Pratama", "academics"));
    // The route serves the hand-picked look.
    const res = await avatarRoute(new Request("http://test/avatars/5"), { params: Promise.resolve({ id: "5" }) });
    expect(await res.text()).toBe(avatarSvg("Sekar Ayu", "opinion", 5));
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

  test("a local cover is resized by the Next image optimiser and credits the photographer", async () => {
    const article = (await getArticleBySlug("the-coffee-queue-is-a-design-problem-not-a-patience-problem"))!;
    const { container } = render(
      <ArticleCover
        article={{
          ...article,
          coverImage: "/covers/1-20.webp",
          coverCredit: { name: "Aleks D", profileUrl: "https://unsplash.com/photos/abc", photoUrl: "https://unsplash.com/", source: "Unsplash" },
        }}
      />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toMatch(/^\/_next\/image\?url=%2Fcovers%2F1-20\.webp&w=\d+/);
    expect(screen.getByRole("link", { name: "Aleks D" }).getAttribute("href")).toBe("https://unsplash.com/photos/abc");
    expect(screen.getByRole("link", { name: "Unsplash" }).getAttribute("href")).toBe("https://unsplash.com/");
  });

  test("every sample photo is a file in public/covers or an Unsplash photo, credited with links to Unsplash", async () => {
    const { default: covers } = await import("../lib/mock/covers.json");
    for (const cover of Object.values(covers as Record<string, { url: string; credit: { name: string; profileUrl: string } }>)) {
      // `npm run covers:picsum` writes local files; `npm run covers` hotlinks Unsplash.
      if (cover.url.startsWith("/")) {
        expect(cover.url).toMatch(/^\/covers\/[\w-]+\.webp$/);
        expect(existsSync(`public${cover.url}`)).toBe(true);
      } else {
        expect(isUnsplash(cover.url)).toBe(true);
      }
      expect(cover.credit.name).not.toBe("");
      expect(cover.credit.profileUrl).toMatch(/^https:\/\/unsplash\.com\//);
    }
  });

  test("only https credit links are linked", async () => {
    expect(isHttpsUrl("https://unsplash.com/@ana")).toBe(true);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("http://unsplash.com/@ana")).toBe(false);
    expect(isHttpsUrl("not a url")).toBe(false);
    const article = (await getArticleBySlug("the-coffee-queue-is-a-design-problem-not-a-patience-problem"))!;
    render(
      <ArticleCover
        article={{
          ...article,
          coverImage: "https://images.unsplash.com/photo-123?ixid=abc",
          coverCredit: { name: "Ana Lee", profileUrl: "javascript:alert(1)", photoUrl: "https://unsplash.com/photos/123", source: "Unsplash" },
        }}
      />,
    );
    expect(screen.queryByRole("link", { name: "Ana Lee" })).toBeNull();
    expect(screen.getByText(/Ana Lee/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Unsplash" })).toBeDefined();
  });

  test("a stock photo shows the photographer credit with links", async () => {
    const article = (await getArticleBySlug("the-coffee-queue-is-a-design-problem-not-a-patience-problem"))!;
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
    const article = (await getArticleBySlug("the-coffee-queue-is-a-design-problem-not-a-patience-problem"))!;
    const { container } = render(<ArticleCover article={{ ...article, coverImage: null, coverCredit: null }} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText(/Photo:/)).toBeNull();
  });
});
