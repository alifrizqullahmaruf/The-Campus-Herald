import { Avatar } from "@/components/author/avatar";
import { Button } from "@/components/ui/button";
import type { AuthorSummary } from "@/lib/types";

/** Byline card under the article, with the writer's avatar. */
export function AuthorBox({ author }: { author: AuthorSummary }) {
  return (
    <section
      aria-label="About the author"
      className="flex flex-col gap-4 rounded-card border-3 border-ink bg-surface p-5 shadow-hard sm:flex-row sm:items-center"
    >
      <Avatar userId={author.id} className="size-16 shrink-0 rounded-full border-3 border-ink" />
      <div className="flex-1">
        <p className="text-meta text-ink-muted">Written by · {author.beat}</p>
        <p className="mt-1 font-display text-xl font-black">{author.name}</p>
        <p className="mt-1 text-ink-muted">{author.bio}</p>
      </div>
      <Button href={`/authors/${author.id}`} variant="dark" arrow>
        More from {author.name.split(" ")[0]}
      </Button>
    </section>
  );
}
