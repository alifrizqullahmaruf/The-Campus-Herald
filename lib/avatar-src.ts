/**
 * URL of a user's avatar, served (and prerendered) by app/avatars/[id]/route.ts.
 * Kept apart from lib/avatar.ts so client components can use it without
 * bundling the avatar generator.
 */
export function avatarSrc(userId: number): string {
  return `/avatars/${userId}`;
}
