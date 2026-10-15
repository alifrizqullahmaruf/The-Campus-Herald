"use client";

import { useEffect } from "react";
import { Button } from "./button";

/** Shared body for error.tsx boundaries: explains, offers a retry and a way home. */
export function ErrorPanel({ error, retry, home }: { error: Error & { digest?: string }; retry: () => void; home: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto my-16 w-full max-w-lg rounded-card border-3 border-ink bg-surface p-8 text-center shadow-hard">
      <p className="font-display text-5xl font-black">Oops.</p>
      <h1 className="mt-3 font-display text-2xl font-black">Something went wrong on our side.</h1>
      <p className="mt-2 text-ink-muted">Try again in a moment. If it keeps happening, tell the society.</p>
      {error.digest && <p className="mt-3 text-meta text-ink-muted">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={retry}>Try again</Button>
        <Button href={home} variant="secondary">
          Go back
        </Button>
      </div>
    </div>
  );
}
