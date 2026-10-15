import type { Metadata } from "next";
import { AllArticles } from "@/components/dashboard/all-articles";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAllArticles } from "@/lib/data/articles";

export const metadata: Metadata = { title: "All articles" };

export default async function AllArticlesPage() {
  const articles = await getAllArticles();
  const light = articles.map((article) => ({ ...article, body: "" }));
  return (
    <>
      <PageHeader title="All articles." description="Every article from every author, in any status." />
      <AllArticles articles={light} />
    </>
  );
}
