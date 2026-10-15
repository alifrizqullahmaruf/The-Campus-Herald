import type { Metadata } from "next";
import { AuthorManager, type ManagedAuthor } from "@/components/dashboard/author-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAllUsers, getAuthorProfile } from "@/lib/data/users";

export const metadata: Metadata = { title: "Authors" };

export default async function ManageAuthorsPage() {
  const users = (await getAllUsers()).filter((user) => user.role === "author");
  const authors: ManagedAuthor[] = await Promise.all(
    users.map(async (user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      articleCount: (await getAuthorProfile(user.id))?.articleCount ?? 0,
    })),
  );

  return (
    <>
      <PageHeader
        title="Authors."
        description="Add new society members, deactivate accounts when people leave, and reset forgotten passwords. Accounts are never deleted, so old articles keep their author."
      />
      <AuthorManager initialAuthors={authors} />
    </>
  );
}
