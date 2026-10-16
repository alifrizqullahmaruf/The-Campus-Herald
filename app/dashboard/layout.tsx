import type { Metadata } from "next";
import { PreviewBanner } from "@/components/dashboard/preview-banner";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getPendingArticles } from "@/lib/data/articles";
import { getAllUsers } from "@/lib/data/users";
import { PREVIEW_ADMIN_ID, PREVIEW_AUTHOR_ID } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard · Side Notes" },
  robots: { index: false, follow: false },
};

// Calmer than the public site (docs/design.md 4, Dashboard): same tokens, less colour, no tilt.
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [users, pending] = await Promise.all([getAllUsers(), getPendingArticles()]);
  const author = users.find((u) => u.id === PREVIEW_AUTHOR_ID)!;
  const admin = users.find((u) => u.id === PREVIEW_ADMIN_ID)!;

  return (
    <div className="flex min-h-screen">
      <Sidebar author={author} admin={admin} pendingCount={pending.length} />
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <PreviewBanner />
        <main id="main" className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
