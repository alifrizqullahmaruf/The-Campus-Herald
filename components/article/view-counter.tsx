"use client";

import { useEffect } from "react";

/**
 * Counts this read (Phase 4 day 7): one POST once the article is shown. The server
 * counts a browser once a day (app/api/views/[id]/route.ts), so a kept page that is shown
 * again and runs this effect again is not counted twice. Renders nothing.
 */
export function ViewCounter({ articleId }: { articleId: number }) {
  useEffect(() => {
    fetch(`/api/views/${articleId}`, { method: "POST", keepalive: true }).catch(() => {});
  }, [articleId]);
  return null;
}
