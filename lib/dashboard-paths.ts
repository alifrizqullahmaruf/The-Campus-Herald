/** Dashboard paths that belong to the administrator. */
export function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard/review") ||
    pathname.startsWith("/dashboard/authors") ||
    pathname === "/dashboard/articles"
  );
}
