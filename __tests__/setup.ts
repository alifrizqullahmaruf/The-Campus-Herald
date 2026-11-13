import { vi } from "vitest";

// Unit tests run on the sample data, without a database. The SQL in lib/data is covered
// by the E2E tests (docs/plans/2026-11-02-fase-2-database.md).
vi.mock("@/lib/data/users", () => import("@/lib/mock/users-data"));
vi.mock("@/lib/data/articles", () => import("@/lib/mock/articles-data"));
vi.mock("@/lib/data/session", () => import("@/lib/mock/session-data"));
// The login Server Actions need cookies and the database; components only see fakes.
vi.mock("@/lib/auth/actions", () => ({
  login: vi.fn(async (_previous: unknown, formData: FormData) => ({
    error: "That email and password do not match an active account.",
    email: String(formData.get("email") ?? ""),
  })),
  logout: vi.fn(async () => {}),
}));

// These only work inside a Next.js cache scope.
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));
