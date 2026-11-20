"use client";

import { AlertTriangle, KeyRound, UserPlus, UserRoundCheck, UserRoundX } from "lucide-react";
import { useCallback, useId, useLayoutEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Avatar } from "@/components/author/avatar";
import { Button } from "@/components/ui/button";
import { createAuthor, resetAuthorPassword, setAuthorActive } from "@/lib/auth/author-actions";
import { validateNewAuthor, type NewAuthorErrors } from "@/lib/auth/author-rules";
import { cx } from "@/lib/cx";

export { validateNewAuthor, type NewAuthorErrors };

export interface ManagedAuthor {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  articleCount: number;
}

/** A temporary password the administrator is about to hand over; shown once. */
interface Handover {
  name: string;
  email: string;
  password: string;
}

/**
 * Admin list of author accounts (Phase 4 day 5). Accounts are deactivated, never deleted,
 * so old articles keep their author (spec, stage 06). Every change is stored by a Server
 * Action that checks the administrator again; a new account and a reset get a temporary
 * password from the server, shown here once.
 */
export function AuthorManager({ initialAuthors }: { initialAuthors: ManagedAuthor[] }) {
  const [authors, setAuthors] = useState(initialAuthors);
  // The list as the server last sent it. Next keeps this page (hidden, with its state) and
  // renders it again after every change: the stored list replaces the local one, without
  // remounting, so a password just shown stays on screen.
  const [stored, setStored] = useState(initialAuthors);
  if (stored !== initialAuthors) {
    setStored(initialAuthors);
    setAuthors(initialAuthors);
  }
  const [message, setMessage] = useState("");
  const [handover, setHandover] = useState<Handover | null>(null);
  const [confirmReset, setConfirmReset] = useState<number | null>(null);
  const [busyIds, setBusyIds] = useState<ReadonlySet<number>>(new Set());
  const [, startBusy] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Next keeps this page in the document, hidden, when the administrator moves on
  // (docs 02-guides/preserving-ui-state.md): a password must not stay there.
  useLayoutEffect(
    () => () => {
      setHandover(null);
      setConfirmReset(null);
    },
    [],
  );

  // Stable, so focus moves to the password panel once, when it appears, not on every render.
  const focusPanel = useCallback((panel: HTMLDivElement | null) => panel?.focus(), []);

  function setBusy(id: number, busy: boolean) {
    setBusyIds((ids) => {
      const next = new Set(ids);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function update(id: number, change: Partial<ManagedAuthor>) {
    setAuthors((list) => list.map((a) => (a.id === id ? { ...a, ...change } : a)));
  }

  function toggleActive(author: ManagedAuthor) {
    setMessage("");
    setBusy(author.id, true);
    startBusy(async () => {
      const result = await setAuthorActive(author.id, !author.isActive).catch(() => null);
      setBusy(author.id, false);
      if (result === undefined) return; // The session ended: the action went to the login page.
      if (!result?.ok) {
        setMessage(result?.message ?? "Could not save the change. Check your connection and try again.");
        return;
      }
      update(author.id, { isActive: result.isActive });
      setMessage(result.isActive ? `${author.name} can log in again.` : `${author.name} can no longer log in.`);
    });
  }

  function resetPassword(author: ManagedAuthor) {
    setMessage("");
    setBusy(author.id, true);
    startBusy(async () => {
      const result = await resetAuthorPassword(author.id).catch(() => null);
      setBusy(author.id, false);
      setConfirmReset(null);
      if (result === undefined) return;
      if (!result?.ok) {
        setMessage(result?.message ?? "Could not reset the password. Check your connection and try again.");
        return;
      }
      setHandover({ name: author.name, email: author.email, password: result.temporaryPassword });
      setMessage(`${author.name}'s password was reset and their earlier logins have ended. The new temporary password is shown below.`);
    });
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="min-h-6 text-sm font-semibold">
          {message}
        </p>
        <Button onClick={() => dialogRef.current?.showModal()}>
          <UserPlus aria-hidden="true" className="size-4" strokeWidth={2.5} />
          Add author
        </Button>
      </div>

      {handover && (
        <div
          ref={focusPanel}
          tabIndex={-1}
          role="region"
          aria-label="Temporary password"
          className="mt-6 rounded-card border-3 border-ink bg-cat-events p-4 shadow-hard [overflow-wrap:anywhere]">
          <p className="font-display font-extrabold">Temporary password for {handover.name}</p>
          <p className="mt-1 text-sm">
            {handover.email} logs in with:{" "}
            <code className="rounded-inner border-2 border-ink bg-surface px-2 py-0.5 font-mono text-base">{handover.password}</code>
          </p>
          <p className="mt-2 text-sm">Give it to them in person. It is not shown again.</p>
          <Button variant="secondary" className="mt-3 px-3 text-sm" onClick={() => setHandover(null)}>
            Done
          </Button>
        </div>
      )}

      {/* grid-cols-1: a long email (truncated in its card) must not widen the column on phones. */}
      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {authors.map((author) => (
          <li
            key={author.id}
            className={cx(
              "flex flex-col gap-4 rounded-card border-3 border-ink p-4",
              author.isActive ? "bg-surface" : "border-dashed bg-paper",
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar userId={author.id} className="size-12 shrink-0 rounded-full border-2 border-ink" />
              <div className="min-w-0 flex-1">
                {/* A long name without spaces wraps instead of pushing the card past a phone screen. */}
                <p className="font-display text-lg font-extrabold leading-tight [overflow-wrap:anywhere]">{author.name}</p>
                <p className="truncate text-sm text-ink-muted">{author.email}</p>
              </div>
              <span
                className={cx(
                  "rounded-full border-2 border-ink px-2 py-0.5 text-meta",
                  author.isActive ? "bg-cat-organisations" : "bg-surface",
                )}
              >
                {author.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-meta text-ink-muted">
              {author.articleCount} published {author.articleCount === 1 ? "article" : "articles"}
            </p>
            {confirmReset === author.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Reset the password and end their logins?</span>
                <Button
                  variant="secondary"
                  className="px-3 text-sm"
                  disabled={busyIds.has(author.id)}
                  onClick={() => setConfirmReset(null)}
                >
                  Cancel
                </Button>
                <Button className="px-3 text-sm" disabled={busyIds.has(author.id)} onClick={() => resetPassword(author)}>
                  {busyIds.has(author.id) ? "Resetting…" : "Yes, reset"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="px-3 text-sm"
                  aria-label={`${author.isActive ? "Deactivate" : "Reactivate"} ${author.name}`}
                  disabled={busyIds.has(author.id)}
                  onClick={() => toggleActive(author)}
                >
                  {author.isActive ? (
                    <UserRoundX aria-hidden="true" className="size-4" strokeWidth={2.5} />
                  ) : (
                    <UserRoundCheck aria-hidden="true" className="size-4" strokeWidth={2.5} />
                  )}
                  {author.isActive ? "Deactivate" : "Reactivate"}
                </Button>
                <Button
                  variant="secondary"
                  className="px-3 text-sm"
                  aria-label={`Reset password for ${author.name}`}
                  disabled={busyIds.has(author.id)}
                  onClick={() => setConfirmReset(author.id)}
                >
                  <KeyRound aria-hidden="true" className="size-4" strokeWidth={2.5} />
                  Reset password
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <AddAuthorDialog
        dialogRef={dialogRef}
        existingEmails={authors.map((a) => a.email)}
        onAdded={(author, password) => {
          // The list the server sends back after the save may already hold them.
          setAuthors((list) => (list.some((a) => a.id === author.id) ? list : [...list, author]));
          setHandover({ name: author.name, email: author.email, password });
          setMessage(`${author.name} can now log in. Their temporary password is shown below.`);
        }}
      />
    </>
  );
}

function AddAuthorDialog({
  dialogRef,
  existingEmails,
  onAdded,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  existingEmails: string[];
  onAdded: (author: ManagedAuthor, temporaryPassword: string) => void;
}) {
  const ids = { title: useId(), name: useId(), email: useId(), message: useId() };
  const [errors, setErrors] = useState<NewAuthorErrors>({});
  const [message, setMessage] = useState("");
  const [busy, startBusy] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const fields = { name: String(data.get("name") ?? ""), email: String(data.get("email") ?? "") };
    const found = validateNewAuthor(fields, existingEmails);
    setErrors(found);
    setMessage("");
    if (Object.keys(found).length > 0) return;
    startBusy(async () => {
      const result = await createAuthor(fields).catch(() => null);
      if (result === undefined) return;
      if (!result?.ok) {
        setErrors(result?.errors ?? {});
        setMessage(result?.message ?? "Could not add the author. Check your connection and try again.");
        return;
      }
      onAdded({ id: result.id, name: fields.name.trim(), email: result.email, isActive: true, articleCount: 0 }, result.temporaryPassword);
      form.reset();
      dialogRef.current?.close();
    });
  }

  const input = (invalid: boolean) =>
    cx(
      "h-11 w-full rounded-inner border-3 bg-surface px-3 outline-none focus:outline-3 focus:outline-offset-2 focus:outline-cat-events",
      invalid ? "border-cat-opinion" : "border-ink",
    );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={ids.title}
      onClose={() => {
        setErrors({});
        setMessage("");
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(440px,calc(100vw-32px))] overflow-y-auto rounded-card border-3 border-ink bg-surface p-0 text-ink shadow-hard-lift backdrop:bg-ink/40"
    >
      <form onSubmit={submit} noValidate className="p-6">
        <h2 id={ids.title} className="font-display text-2xl font-black">
          Add an author.
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          They get a temporary password, shown once after you add them. Give it to them in person.
        </p>
        {(
          [
            ["name", "Name", "text", ids.name],
            ["email", "Email", "email", ids.email],
          ] as const
        ).map(([key, label, type, id]) => (
          <div key={key} className="mt-4">
            <label htmlFor={id} className="mb-1 block font-semibold">
              {label}
            </label>
            <input
              id={id}
              name={key}
              type={type}
              autoComplete="off"
              disabled={busy}
              aria-invalid={Boolean(errors[key])}
              aria-describedby={errors[key] ? `${id}-error` : undefined}
              className={input(Boolean(errors[key]))}
            />
            {errors[key] && (
              <p id={`${id}-error`} className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                <AlertTriangle aria-hidden="true" className="size-4 text-cat-opinion" strokeWidth={2.5} />
                {errors[key]}
              </p>
            )}
          </div>
        ))}
        <p id={ids.message} role="status" className="mt-4 min-h-5 text-sm font-semibold">
          {message}
        </p>
        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add author"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
