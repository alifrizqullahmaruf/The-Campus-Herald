import type { Metadata } from "next";
import { AllArticles } from "@/components/dashboard/all-articles";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAllArticles } from "@/lib/data/articles";

export const metadata: Metadata = { title: "All articles" };

// Behind the login: rendered for each request, waiting for the session on the server.
export const instant = false;

export default async function AllArticlesPage() {
  await requireAdmin();
  const articles = await getAllArticles();
  const light = articles.map((article) => ({ ...article, body: "" }));
  return (
    <>
      <PageHeader title="All articles." description="Every article from every author, in any status." />
      <AllArticles articles={light} />
    </>
  );
}
