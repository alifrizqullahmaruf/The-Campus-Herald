"use client";

import { AlertTriangle, Check, Undo2 } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { approveArticle, rejectArticle } from "@/lib/articles/review-actions";
import { MAX_REVIEW_NOTE_LENGTH, validateReviewNote } from "@/lib/articles/review-rules";
import type { ArticleStatus } from "@/lib/types";

export { validateReviewNote };

type Step = "idle" | "confirm-approve" | "rejecting";

/**
 * Approve or send back an article (Phase 4 day 4). Approving takes two clicks instead of a
 * browser confirm dialog; sending back needs a note for the author. The decision is
 * stored by a Server Action, which checks the role and the status again.
 */
export function ReviewPanel({ articleId, initialStatus }: { articleId: number; initialStatus: ArticleStatus }) {
  const noteId = useId();
  const errorId = useId();
  const [status, setStatus] = useState(initialStatus);
  const [step, setStep] = useState<Step>("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, startBusy] = useTransition();

  function run(action: () => Promise<Awaited<ReturnType<typeof approveArticle>>>, done: string) {
    setMessage("");
    startBusy(async () => {
      const result = await action().catch(() => null);
      // Nothing at all: the session ended and the action redirected to the login page.
      if (result === undefined) return;
      if (result === null) {
        setMessage("Could not save the decision. Check your connection and try again.");
        return;
      }
      if (!result.ok) {
        if (result.error === "note") setError(result.message);
        else setMessage(result.message);
        return;
      }
      setStatus(result.status);
      setStep("idle");
      setNote("");
      setMessage(done);
    });
  }

  function approve() {
    run(() => approveArticle(articleId), "Approved and published.");
  }

  function reject() {
    const problem = validateReviewNote(note);
    setError(problem);
    if (problem) return;
    run(() => rejectArticle(articleId, note), "Sent back to the author with your note.");
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] z-30 border-t-3 border-ink bg-paper/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <p role="status" className="text-sm font-semibold">
              {message}
            </p>
          </div>

          {status === "pending" && step === "idle" && (
            <div className="flex flex-wrap gap-3">
              <Button variant="danger" onClick={() => setStep("rejecting")}>
                <Undo2 aria-hidden="true" className="size-4" strokeWidth={2.5} />
                Send back
              </Button>
              <Button className="bg-cat-organisations" onClick={() => setStep("confirm-approve")}>
                <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                Approve
              </Button>
            </div>
          )}

          {status === "pending" && step === "confirm-approve" && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold">Publish this article now?</span>
              <Button variant="secondary" onClick={() => setStep("idle")} disabled={busy}>
                Cancel
              </Button>
              <Button className="bg-cat-organisations" onClick={approve} disabled={busy}>
                {busy ? "Publishing…" : "Yes, publish"}
              </Button>
            </div>
          )}
        </div>

        {status === "pending" && step === "rejecting" && (
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label htmlFor={noteId} className="mb-1 block font-semibold">
                Note for the author
              </label>
              <textarea
                id={noteId}
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={busy}
                maxLength={MAX_REVIEW_NOTE_LENGTH}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                placeholder="What should they change before resubmitting?"
                className="w-full rounded-inner border-3 border-ink bg-surface px-3 py-2 outline-none focus:outline-3 focus:outline-offset-2 focus:outline-cat-events"
              />
              {error && (
                <p id={errorId} className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                  <AlertTriangle aria-hidden="true" className="size-4 text-cat-opinion" strokeWidth={2.5} />
                  {error}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setStep("idle");
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={reject} disabled={busy}>
                {busy ? "Sending…" : "Send back"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
