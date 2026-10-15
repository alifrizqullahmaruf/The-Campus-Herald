"use client";

import { AlertTriangle, Lock } from "lucide-react";
import dynamic from "next/dynamic";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CATEGORIES } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { ArticleStatus, ArticleWithRelations } from "@/lib/types";
// Tiptap generates random ids while it initialises, which is not allowed during
// prerendering, so the editor renders in the browser only.
const RichTextEditor = dynamic(() => import("./rich-text-editor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="min-h-80 animate-pulse rounded-card border-3 border-ink bg-surface" />,
});

export interface EditorErrors {
  title?: string;
  category?: string;
  body?: string;
}

/** Checks required before an article can go to the editor. Drafts may be incomplete. */
export function validateForSubmit(fields: { title: string; categorySlug: string; bodyEmpty: boolean }): EditorErrors {
  const errors: EditorErrors = {};
  if (!fields.title.trim()) errors.title = "Give the article a title.";
  if (!fields.categorySlug) errors.category = "Choose a category.";
  if (fields.bodyEmpty) errors.body = "Write the article before submitting it.";
  return errors;
}

/** Authors can edit drafts and articles sent back to them; the rest is read-only. */
export function isEditable(status: ArticleStatus): boolean {
  return status === "draft" || status === "rejected";
}

/**
 * Write or edit an article (docs/design.md 4, Editor). Preview only:
 * buttons update the screen; saving arrives with Server Actions in Phase 4.
 */
export function ArticleEditor({ article }: { article: ArticleWithRelations | null }) {
  const ids = { title: useId(), category: useId(), body: useId(), cover: useId(), alt: useId() };
  const [status, setStatus] = useState<ArticleStatus>(article?.status ?? "draft");
  const [title, setTitle] = useState(article?.title ?? "");
  const [categorySlug, setCategorySlug] = useState<string>(article?.category.slug ?? "");
  const [bodyEmpty, setBodyEmpty] = useState(!article?.body);
  const [cover, setCover] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [errors, setErrors] = useState<EditorErrors>({});
  const [message, setMessage] = useState("");

  const editable = isEditable(status);

  function saveDraft() {
    setErrors({});
    setMessage("Draft saved (preview only: nothing is stored yet).");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateForSubmit({ title, categorySlug, bodyEmpty });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage("Fix the highlighted fields, then submit again.");
      return;
    }
    setStatus("pending");
    setMessage("Sent to the editor for review (preview only: nothing is stored yet).");
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 pb-28">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={status} />
        {!editable && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <Lock aria-hidden="true" className="size-4" />
            {status === "pending"
              ? "Waiting for the editor. You can edit again if it is sent back."
              : "Published articles can no longer be edited."}
          </span>
        )}
      </div>

      {status === "rejected" && article?.reviewNote && (
        <div role="note" className="mb-6 flex gap-3 rounded-card border-3 border-cat-opinion bg-surface p-4">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cat-opinion" strokeWidth={2.5} />
          <div>
            <p className="font-display font-extrabold">The editor sent this back</p>
            <p className="mt-1">{article.reviewNote}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Field id={ids.title} label="Title" error={errors.title}>
            <input
              id={ids.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!editable}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${ids.title}-error` : undefined}
              placeholder="A short, clear headline"
              className={inputClass(Boolean(errors.title), "h-14 font-display text-xl font-extrabold")}
            />
          </Field>

          <div>
            <p id={ids.body} className="mb-2 font-semibold">
              Article
            </p>
            <RichTextEditor
              initialHtml={article?.body ?? ""}
              editable={editable}
              labelledBy={ids.body}
              invalid={Boolean(errors.body)}
              onChange={(_, empty) => setBodyEmpty(empty)}
            />
            {errors.body && <FieldError id={`${ids.body}-error`}>{errors.body}</FieldError>}
          </div>
        </div>

        <div className="space-y-6">
          <Field id={ids.category} label="Category" error={errors.category}>
            <select
              id={ids.category}
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              disabled={!editable}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? `${ids.category}-error` : undefined}
              className={inputClass(Boolean(errors.category), "h-12")}
            >
              <option value="">Choose one…</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-card border-3 border-ink bg-surface p-4">
            <label htmlFor={ids.cover} className="font-semibold">
              Cover image
            </label>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimisable asset
              <img src={cover} alt={alt} className="mt-3 aspect-4/3 w-full rounded-inner border-2 border-ink object-cover" />
            )}
            <input
              id={ids.cover}
              type="file"
              accept="image/*"
              disabled={!editable}
              onChange={(e) => {
                const file = e.target.files?.[0];
                setCover(file ? URL.createObjectURL(file) : null);
              }}
              className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-2 file:border-ink file:bg-cat-events file:px-3 file:py-1 file:font-semibold"
            />
            <label htmlFor={ids.alt} className="mt-4 block text-sm font-semibold">
              Describe the image
            </label>
            <input
              id={ids.alt}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              disabled={!editable}
              placeholder="e.g. Students queueing at the canteen"
              className={inputClass(false, "mt-1 h-10 text-sm")}
            />
            <p className="mt-1 text-xs text-ink-muted">Read aloud to people who cannot see the image.</p>
          </div>
        </div>
      </div>

      <p role="status" className="mt-6 min-h-6 font-semibold">
        {message}
      </p>

      {editable && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t-3 border-ink bg-paper/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" onClick={saveDraft}>
              Save draft
            </Button>
            <Button type="submit">Submit for review</Button>
          </div>
        </div>
      )}
    </form>
  );
}

function inputClass(invalid: boolean, extra: string) {
  return cx(
    "w-full rounded-inner border-3 bg-surface px-3 outline-none placeholder:font-mono placeholder:text-sm placeholder:font-normal placeholder:text-ink-muted",
    "focus:outline-3 focus:outline-offset-2 focus:outline-cat-events disabled:bg-paper disabled:text-ink-muted",
    invalid ? "border-cat-opinion" : "border-ink",
    extra,
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold">
        {label}
      </label>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
      <AlertTriangle aria-hidden="true" className="size-4 text-cat-opinion" strokeWidth={2.5} />
      {children}
    </p>
  );
}
