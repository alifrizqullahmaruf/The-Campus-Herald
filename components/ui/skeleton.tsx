import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { cx } from "@/lib/cx";

// Loading placeholders for pages that read the URL (`params`) inside <Suspense>:
// on a click the skeleton shows at once and the page streams in. Each one copies
// its page's layout so nothing jumps when the content arrives.

/** Faded block standing in for content that is still loading. Pulses unless reduced motion is on. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("rounded-card bg-ink/10 motion-safe:animate-pulse", className)} />;
}

function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// Same frame as ArticleCard: badge row, 4:3 cover, two-line title, excerpt, meta.
function CardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-card border-3 border-ink/15 p-3">
      <div className="flex items-center justify-between px-1 pb-3">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="aspect-4/3" />
      <div className="px-1 pt-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="mt-1 h-6 w-2/3" />
        <Skeleton className="mt-3 h-5 w-full" />
        <Skeleton className="mt-1 h-5 w-4/5" />
        <Skeleton className="mt-4 h-5 w-full" />
      </div>
    </div>
  );
}

/** Stands in for /articles/[slug]: badge, title, lead, meta and cover. */
export function ArticleSkeleton() {
  return (
    <Loading label="Loading article…">
      <Container className="py-12 md:py-16">
        <div className="max-w-3xl">
          <Skeleton className="h-7 w-28 rounded-full" />
          {/* A typical sample title at the title's size and 0.95 line height: four
              lines, five on phones, where the lead also wraps once more. */}
          <div className="mt-4 flex flex-col gap-[0.15em] py-[0.075em] text-[clamp(36px,6vw,72px)]">
            <Skeleton className="h-[0.8em] w-full" />
            <Skeleton className="h-[0.8em] w-full" />
            <Skeleton className="h-[0.8em] w-full" />
            <Skeleton className="h-[0.8em] w-1/2" />
            <Skeleton className="h-[0.8em] w-1/3 sm:hidden" />
          </div>
          <Skeleton className="mt-5 h-7 w-full" />
          <Skeleton className="mt-1.5 h-7 w-4/5" />
          <Skeleton className="mt-1.5 h-7 w-1/2 sm:hidden" />
          <Skeleton className="mt-5 h-4 w-48" />
        </div>
        <Skeleton className="mt-8 aspect-16/9" />
      </Container>
    </Loading>
  );
}

/** Stands in for /categories/[slug]: topic header, then article cards beside the most-read box. */
export function TopicSkeleton() {
  return (
    <Loading label="Loading topic…">
      <div className="border-b-3 border-ink py-14 md:py-20">
        <Container>
          <Skeleton className="h-6 w-16 rounded-full" />
          {/* Same box as the topic h1: icon above the name on phones, beside it from sm. */}
          <div className="mt-3 flex flex-col items-start gap-3 text-[clamp(28px,8.4vw,104px)] sm:flex-row sm:items-center sm:gap-4">
            <Skeleton className="size-[0.8em] shrink-0" />
            <Skeleton className="h-[0.95em] w-3/4" />
          </div>
          <Skeleton className="mt-4 h-6 w-full max-w-xl" />
          <Skeleton className="mt-2 h-6 w-2/3 sm:hidden" />
          <Skeleton className="mt-4 h-4 w-40" />
        </Container>
      </div>
      <Container className="grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-80" />
      </Container>
    </Loading>
  );
}

/** Stands in for /authors/[id]: avatar, name and bio, then article cards. */
export function AuthorSkeleton() {
  return (
    <Loading label="Loading writer…">
      <div className="border-b-3 border-ink">
        <Container className="flex flex-col gap-8 py-14 md:flex-row md:items-center md:py-20">
          <Skeleton className="size-36 shrink-0 md:size-48" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="mt-3 h-[clamp(36px,7vw,80px)] w-2/3" />
            <Skeleton className="mt-4 h-6 w-full max-w-xl" />
            <Skeleton className="mt-2 h-6 w-2/3 md:hidden" />
            <Skeleton className="mt-4 h-4 w-40" />
          </div>
        </Container>
      </div>
      <Container className="py-14 md:py-20">
        <Skeleton className="h-[clamp(28px,4vw,48px)] w-72 max-w-full" />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </Loading>
  );
}
