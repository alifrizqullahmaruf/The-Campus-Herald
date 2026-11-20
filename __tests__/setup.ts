import { vi } from "vitest";

// Unit tests run on the sample data, without a database. The SQL in lib/data is covered
// by the E2E tests (docs/plans/2026-11-02-fase-2-database.md).
vi.mock("@/lib/data/users", () => import("@/lib/mock/users-data"));
vi.mock("@/lib/data/articles", () => import("@/lib/mock/articles-data"));
// The login Server Actions need cookies and the database; components only see fakes.
vi.mock("@/lib/auth/actions", () => ({
  login: vi.fn(async (_previous: unknown, formData: FormData) => ({
    error: "That email and password do not match an active account.",
    email: String(formData.get("email") ?? ""),
  })),
  logout: vi.fn(async () => {}),
}));

// Saving needs the database and a session; components only see a fake that "saves" as id 101.
vi.mock("@/lib/articles/actions", () => ({
  saveDraft: vi.fn(async (input: { id: number | null }) => ({
    ok: true,
    id: input.id ?? 101,
    savedAt: "2026-11-18T10:00:00.000Z",
  })),
  submitForReview: vi.fn(async (input: { id: number | null }) => ({ ok: true, id: input.id ?? 101, status: "pending" })),
}));

// The review decisions need the database and the administrator's session.
vi.mock("@/lib/articles/review-actions", () => ({
  approveArticle: vi.fn(async () => ({ ok: true, status: "published" })),
  rejectArticle: vi.fn(async () => ({ ok: true, status: "rejected" })),
}));

// Managing authors needs the database and the administrator's session.
vi.mock("@/lib/auth/author-actions", () => ({
  createAuthor: vi.fn(async (input: { email: string }) => ({
    ok: true,
    id: 101,
    email: input.email.trim().toLowerCase(),
    temporaryPassword: "abcd-efgh-jkmn-pqrs",
  })),
  setAuthorActive: vi.fn(async (_id: number, active: boolean) => ({ ok: true, isActive: active })),
  resetAuthorPassword: vi.fn(async () => ({ ok: true, temporaryPassword: "wxyz-2345-6789-abcd" })),
}));

// Throws outside a React Server Components bundle; tests import server modules directly.
vi.mock("server-only", () => ({}));

// These only work inside a Next.js cache scope.
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {}, io: async () => {}, updateTag: vi.fn() }));
