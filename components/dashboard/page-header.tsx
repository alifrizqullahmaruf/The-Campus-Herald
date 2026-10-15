import type { ReactNode } from "react";

/** Title row for dashboard pages: display title, optional description and actions. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b-3 border-ink pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-black leading-none">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
