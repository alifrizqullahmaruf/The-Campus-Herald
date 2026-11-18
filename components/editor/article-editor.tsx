"use client";

import { AlertTriangle, Lock } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { saveDraft } from "@/lib/articles/actions";
import {
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  validateDraft,
  validateForSubmit,
  type EditorErrors,
} from "@/lib/articles/draft-rules";
import { CATEGORIES } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { ArticleStatus, ArticleWithRelations } from "@/lib/types";
// Tiptap generates random ids while it initialises, which is not allowed during
// prerendering, so the editor renders in the browser only.
const RichTextEditor = dynamic(() => import("./rich-text-editor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="min-h-80 animate-pulse rounded-card border-3 border-ink bg-surface" />,
});

export { validateForSubmit, type EditorErrors };

/**
 * The editor for a new article. Next keeps a page it navigates away from (hidden, with its
 * state: docs 02-guides/preserving-ui-state.md), so after the first save moves to the
 * article's own page, "New article" would still hold that article and a second save would
 * create a copy. A fresh editor replaces it once the page is hidden.
 */
export function NewArticleEditor() {
  const [generation, setGeneration] = useState(0);
  const shouldReset = useRef(false);
  useLayoutEffect(
    () => () => {
      if (shouldReset.current) {
        shouldReset.current = false;
        setGeneration((g) => g + 1);
      }
    },
    [],
  );
  return <ArticleEditor key={generation} article={null} canEdit onCreated={() => (shouldReset.current = true)} />;
}

/** Authors can edit drafts and articles sent back to them; the rest is read-only. */
export function isEditable(status: ArticleStatus): boolean {
  return status === "draft" || status === "rejected";
}

/**
 * Write or edit an article (docs/design.md 4, Editor). "Save draft" stores it (Phase 4,
 * day 2); submitting is still a preview until day 3. Only the author may change an
 * article (`canEdit`): to the administrator someone else's article is read-only.
 */
export function ArticleEditor({
  article,
  canEdit,
  justSaved = false,
  onCreated,
}: {
  article: ArticleWithRelations | null;
  canEdit: boolean;
  /** The page opened right after this article's first save (`?saved=1`). */
  justSaved?: boolean;
  /** A new article was saved for the first time (see NewArticleEditor). */
  onCreated?: () => void;
}) {
  const router = useRouter();
  const ids = { title: useId(), summary: useId(), category: useId(), body: useId(), cover: useId(), alt: useId() };
  const [status, setStatus] = useState<ArticleStatus>(article?.status ?? "draft");
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.excerpt ?? "");
  const bodyHtml = useRef(article?.body ?? "");
  const [categorySlug, setCategorySlug] = useState<string>(article?.category.slug ?? "");
  const [bodyEmpty, setBodyEmpty] = useState(!article?.body);
  const [cover, setCover] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [errors, setErrors] = useState<EditorErrors>({});
  const [message, setMessage] = useState(justSaved ? "Draft saved." : "");
  const [saving, startSaving] = useTransition();

  const isNew = article === null;
  // A new article moves to its own page once saved, which mounts the editor again: nothing
  // may be typed in the meantime, or it would be lost.
  const editable = canEdit && isEditable(status) && !(isNew && saving);

  // The notice came in the address; take it out so a reload does not show it again.
  useEffect(() => {
    if (justSaved) window.history.replaceState(null, "", window.location.pathname);
  }, [justSaved]);

  function save() {
    const fields = { title, summary, categorySlug, body: bodyHtml.current };
    const found = validateDraft(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage("Fix the highlighted fields, then save again.");
      return;
    }
    setMessage("");
    startSaving(async () => {
      const result = await saveDraft({ id: article?.id ?? null, ...fields }).catch(() => null);
      if (!result) {
        setMessage("Could not save. Check your connection and try again.");
        return;
      }
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message);
        return;
      }
      if (isNew) {
        // The new article has a page of its own now. Changing only the address would not do:
        // the next save would render that page in place of this one and mount the editor
        // again anyway (docs/plans/2026-11-17-fase-4-alur-kerja.md, day 2 review).
        onCreated?.();
        router.replace(`/dashboard/articles/${result.id}?saved=1`, { scroll: false });
        return;
      }
      setMessage("Draft saved.");
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateForSubmit({ title, summary, categorySlug, bodyEmpty });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage("Fix the highlighted fields, then submit again.");
      return;
    }
    setStatus("pending");
    setMessage("Sent to the editor for review (preview only: nothing is stored yet).");
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 pb-36 lg:pb-28">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={status} />
        {!editable && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <Lock aria-hidden="true" className="size-4" />
            {!canEdit
              ? "Only the author can change this article."
              : status === "pending"
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

      {/* Below xl the order is title, category, cover, article (docs/design.md 4);
          from xl the category and cover move to a side column next to the article. */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:items-start">
        <div className="xl:col-start-1">
          <Field id={ids.title} label="Title" error={errors.title}>
            <input
              id={ids.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!editable}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${ids.title}-error` : undefined}
              placeholder="A short, clear headline"
              maxLength={MAX_TITLE_LENGTH}
              className={inputClass(Boolean(errors.title), "h-14 font-display text-xl font-extrabold")}
            />
          </Field>
          <div className="mt-6">
            <Field id={ids.summary} label="Summary" error={errors.summary}>
              <textarea
                id={ids.summary}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={!editable}
                rows={2}
                maxLength={MAX_SUMMARY_LENGTH}
                aria-invalid={Boolean(errors.summary)}
                aria-describedby={`${ids.summary}-hint${errors.summary ? ` ${ids.summary}-error` : ""}`}
                placeholder="One or two sentences on what happened"
                className={inputClass(Boolean(errors.summary), "py-2")}
              />
            </Field>
            <p id={`${ids.summary}-hint`} className="mt-1 text-xs text-ink-muted">
              Shown on article cards and above the article.
            </p>
          </div>
        </div>

        <div className="space-y-6 xl:col-start-2 xl:row-span-2 xl:row-start-1">
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
              className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-2 file:border-ink file:bg-cat-events file:px-3 file:py-2.5 file:font-semibold"
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
              className={inputClass(false, "mt-1 h-12 text-sm")}
            />
            <p className="mt-1 text-xs text-ink-muted">Read aloud to people who cannot see the image.</p>
          </div>
        </div>

        <div className="xl:col-start-1">
          <p id={ids.body} className="mb-2 font-semibold">
            Article
          </p>
          <RichTextEditor
            initialHtml={article?.body ?? ""}
            editable={editable}
            labelledBy={ids.body}
            invalid={Boolean(errors.body)}
            onChange={(html, empty) => {
              bodyHtml.current = html;
              setBodyEmpty(empty);
            }}
          />
          {errors.body && <FieldError id={`${ids.body}-error`}>{errors.body}</FieldError>}
        </div>
      </div>

      <p role="status" className="mt-6 min-h-6 font-semibold">
        {message}
      </p>

      {editable && (
        <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] z-30 border-t-3 border-ink bg-paper/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save draft"}
            </Button>
            {/* "Submit" on phones keeps both buttons on one row; the name stays complete. */}
            <Button type="submit" aria-label="Submit for review">
              Submit<span className="max-sm:hidden">&nbsp;for review</span>
            </Button>
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
