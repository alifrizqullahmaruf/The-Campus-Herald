import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArticleEditor } from "@/components/editor/article-editor";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "New article" };

// Behind the login: rendered for each request, waiting for the session on the server.
export const instant = false;

export default async function NewArticlePage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="New article."
        description="Save as often as you like. When it is ready, submit it and the editor will review it."
      />
      <ArticleEditor article={null} />
    </>
  );
}
