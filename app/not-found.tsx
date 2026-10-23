import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { CategoryPill } from "@/components/ui/category-pill";
import { CATEGORIES } from "@/lib/categories";

export default function NotFound() {
  return (
    <main id="main" className="grid flex-1 place-items-center px-4 py-16">
      <div className="w-full max-w-xl text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p
          aria-hidden="true"
          className="mx-auto mt-10 w-fit -rotate-3 rounded-card border-3 border-ink bg-cat-opinion px-6 font-display text-[clamp(80px,20vw,160px)] font-black leading-none shadow-hard"
        >
          404
        </p>
        <h1 className="mt-8 font-display text-[clamp(32px,6vw,52px)] font-black leading-none">
          This page is not in the margins.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          It may have moved, or it was never published. Try a topic below or search the archive.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/" arrow>
            Back to the front page
          </Button>
          <Button href="/search" variant="secondary">
            Search
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <CategoryPill key={c.slug} slug={c.slug} size="sm" />
          ))}
        </div>
        <p className="mt-10 text-sm">
          <Link href="/login" className="tap-target underline underline-offset-4">
            Author log in
          </Link>
        </p>
      </div>
    </main>
  );
}
