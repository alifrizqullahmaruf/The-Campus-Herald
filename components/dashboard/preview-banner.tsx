import { Info } from "lucide-react";

/** Reminds testers that the dashboard is a design preview with no backend yet. */
export function PreviewBanner() {
  return (
    <div role="note" className="flex items-center gap-2 border-b-3 border-ink bg-accent px-4 py-2 text-sm">
      <Info aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.5} />
      <p>
        <strong className="font-display font-extrabold">Preview, not connected.</strong> Nothing you do here is saved
        yet; login and saving arrive with the database.
      </p>
    </div>
  );
}
