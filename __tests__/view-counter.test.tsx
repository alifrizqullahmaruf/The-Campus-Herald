import { render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ViewCounter } from "../components/article/view-counter";

afterEach(() => vi.unstubAllGlobals());

test("an article shown sends one read to the server and renders nothing", () => {
  const fetch = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetch);
  const { container, rerender } = render(<ViewCounter articleId={7} />);
  rerender(<ViewCounter articleId={7} />);
  expect(container.innerHTML).toBe("");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith("/api/views/7", { method: "POST", keepalive: true });
});
