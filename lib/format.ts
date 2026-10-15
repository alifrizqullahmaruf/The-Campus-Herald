const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  // Fixed zone so server and browser render the same string (no hydration mismatch).
  timeZone: "UTC",
});

/** "Oct 14, 2026". Returns an empty string for null. */
export function formatDate(iso: string | null): string {
  return iso ? DATE.format(new Date(iso)) : "";
}

/** "1,840". */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** Up to two initials from a name: "Sekar Ayu" -> "SA". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
