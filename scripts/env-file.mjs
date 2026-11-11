// Adds a generated value to .env.local for the scripts (the seed's DEV_PASSWORD), with the
// same rules as `npm run db:setup` (scripts/db-local.mjs): an existing name is never
// overwritten, a UTF-16 file is refused, and the new line starts on its own line.
// Values are never printed.

import { appendFileSync, existsSync, readFileSync } from "node:fs";

const ENV_FILE = new URL("../.env.local", import.meta.url);

/** Appends `name=value` to .env.local. Throws if the name is already there or the file is not UTF-8. */
export function appendEnv(name, value) {
  const text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  if (text.includes("\0")) throw new Error(".env.local is not UTF-8 (PowerShell's > writes UTF-16). Save it as UTF-8 first.");
  if (new RegExp(`^\\s*(export\\s+)?${name}\\s*=`, "m").test(text)) throw new Error(`.env.local already has ${name}.`);
  const separator = text && !text.endsWith("\n") ? "\n" : "";
  appendFileSync(ENV_FILE, `${separator}${name}=${value}\n`);
}
