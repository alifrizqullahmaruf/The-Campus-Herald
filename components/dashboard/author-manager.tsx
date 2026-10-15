"use client";

import { AlertTriangle, KeyRound, UserPlus, UserRoundCheck, UserRoundX } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { initials } from "@/lib/format";

export interface ManagedAuthor {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  articleCount: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NewAuthorErrors {
  name?: string;
  email?: string;
  password?: string;
}

/** Rules for a new author account; emails are unique (users.email is UNIQUE). */
export function validateNewAuthor(
  fields: { name: string; email: string; password: string },
  existingEmails: string[],
): NewAuthorErrors {
  const errors: NewAuthorErrors = {};
  const email = fields.email.trim().toLowerCase();
  if (!fields.name.trim()) errors.name = "Enter the author's name.";
  if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
  else if (existingEmails.some((e) => e.toLowerCase() === email)) errors.email = "An account with this email already exists.";
  if (fields.password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

/**
 * Admin list of author accounts. Accounts are deactivated, never deleted, so
 * old articles keep their author (spec, stage 06). Preview only: changes live
 * in this page until it reloads.
 */
export function AuthorManager({ initialAuthors }: { initialAuthors: ManagedAuthor[] }) {
  const [authors, setAuthors] = useState(initialAuthors);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  function toggleActive(id: number) {
    setAuthors((list) => list.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)));
    const author = authors.find((a) => a.id === id);
    if (author) setMessage(`${author.name} is now ${author.isActive ? "deactivated" : "active again"} (preview only).`);
  }

  function resetPassword(name: string) {
    setMessage(`Password reset for ${name} (preview only). The real version shows a temporary password once.`);
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

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {authors.map((author) => (
          <li
            key={author.id}
            className={cx(
              "flex flex-col gap-4 rounded-card border-3 border-ink p-4",
              author.isActive ? "bg-surface" : "border-dashed bg-paper",
            )}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-cat-events font-display font-black">
                {initials(author.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-extrabold leading-tight">{author.name}</p>
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-h-9 px-3 text-sm"
                aria-label={`${author.isActive ? "Deactivate" : "Reactivate"} ${author.name}`}
                onClick={() => toggleActive(author.id)}
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
                className="min-h-9 px-3 text-sm"
                aria-label={`Reset password for ${author.name}`}
                onClick={() => resetPassword(author.name)}
              >
                <KeyRound aria-hidden="true" className="size-4" strokeWidth={2.5} />
                Reset password
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <AddAuthorDialog
        dialogRef={dialogRef}
        existingEmails={authors.map((a) => a.email)}
        onAdd={(name, email) => {
          setAuthors((list) => [
            ...list,
            { id: Math.max(0, ...list.map((a) => a.id)) + 1, name, email, isActive: true, articleCount: 0 },
          ]);
          setMessage(`${name} can now log in with the temporary password (preview only).`);
        }}
      />
    </>
  );
}

function AddAuthorDialog({
  dialogRef,
  existingEmails,
  onAdd,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  existingEmails: string[];
  onAdd: (name: string, email: string) => void;
}) {
  const ids = { title: useId(), name: useId(), email: useId(), password: useId() };
  const [errors, setErrors] = useState<NewAuthorErrors>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const fields = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    };
    const found = validateNewAuthor(fields, existingEmails);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onAdd(fields.name.trim(), fields.email.trim());
    form.reset();
    dialogRef.current?.close();
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
      onClose={() => setErrors({})}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-card border-3 border-ink bg-surface p-0 text-ink shadow-hard-lift backdrop:bg-ink/40"
    >
      <form onSubmit={submit} noValidate className="p-6">
        <h2 id={ids.title} className="font-display text-2xl font-black">
          Add an author.
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Share the temporary password with them in person. They can use it right away.</p>
        {(
          [
            ["name", "Name", "text", ids.name],
            ["email", "Email", "email", ids.email],
            ["password", "Temporary password", "text", ids.password],
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
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          <Button type="submit">Add author</Button>
        </div>
      </form>
    </dialog>
  );
}
