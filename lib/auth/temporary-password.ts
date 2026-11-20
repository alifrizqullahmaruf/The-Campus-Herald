import "server-only";
import { randomInt } from "node:crypto";

// Temporary passwords for new accounts and resets (Phase 4 day 5). The administrator sees one
// once and gives it to the author in person; only its hash is stored (lib/auth/password.ts).

/** Letters and digits that cannot be mistaken for one another (no 0/o, 1/l/i). */
export const TEMPORARY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const GROUPS = 4;
const GROUP_LENGTH = 4;

/** 16 random characters in four groups, e.g. "k7pm-x9qd-3fta-wr2e": about 79 bits. */
export function temporaryPassword(): string {
  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g += 1) {
    let group = "";
    for (let i = 0; i < GROUP_LENGTH; i += 1) group += TEMPORARY_ALPHABET[randomInt(TEMPORARY_ALPHABET.length)];
    groups.push(group);
  }
  return groups.join("-");
}
