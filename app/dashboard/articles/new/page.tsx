import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArticleEditor } from "@/components/editor/article-editor";

export const metadata: Metadata = { title: "New article" };

export default function NewArticlePage() {
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
