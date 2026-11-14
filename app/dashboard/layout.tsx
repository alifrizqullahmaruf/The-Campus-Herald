import type { Metadata } from "next";
import { PreviewBanner } from "@/components/dashboard/preview-banner";
import { DashboardTopBar, Sidebar } from "@/components/dashboard/sidebar";
import { requireUser } from "@/lib/auth/current-user";
import { getPendingArticles } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard · Side Notes" },
  robots: { index: false, follow: false },
};

// Rendered for each request behind the login (Phase 3): the layout waits for the session on
// the server instead of showing a fallback, and each page checks the user again itself.
export const instant = false;

// Calmer than the public site (docs/design.md 4, Dashboard): same tokens, less colour, no tilt.
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const pendingCount = user.role === "admin" ? (await getPendingArticles()).length : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} pendingCount={pendingCount} />
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] lg:pb-0">
        <DashboardTopBar user={user} />
        <PreviewBanner />
        <main id="main" className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
