// Phase 1 has no login. The dashboard previews as these accounts:
// author pages as Rafi, editor (admin) pages as Dewi. Replaced by the
// session (getCurrentUser) in Phase 3.

export const PREVIEW_AUTHOR_ID = 2;
export const PREVIEW_ADMIN_ID = 1;

/** Dashboard paths that belong to the administrator. */
export function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard/review") ||
    pathname.startsWith("/dashboard/authors") ||
    pathname === "/dashboard/articles"
  );
}
