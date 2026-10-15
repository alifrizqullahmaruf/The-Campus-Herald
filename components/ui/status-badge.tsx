import { Check, Clock, Pencil, Undo2, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import type { ArticleStatus } from "@/lib/types";

// Status colours overlap with category colours, so every badge pairs colour
// with an icon and a label (docs/design.md 2.1).
export const STATUS_STYLES: Record<ArticleStatus, { label: string; icon: LucideIcon; className: string }> = {
  draft: { label: "Draft", icon: Pencil, className: "bg-surface border-dashed" },
  pending: { label: "Waiting for review", icon: Clock, className: "bg-cat-events" },
  published: { label: "Published", icon: Check, className: "bg-cat-organisations" },
  rejected: { label: "Needs changes", icon: Undo2, className: "bg-cat-opinion" },
};

export function StatusBadge({ status, className }: { status: ArticleStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = STATUS_STYLES[status];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-0.5 text-meta text-ink",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      {label}
    </span>
  );
}
