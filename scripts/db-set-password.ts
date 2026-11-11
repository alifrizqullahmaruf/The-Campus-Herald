// Sets one account's password: `npm run db:set-password <email>`
// (docs/plans/2026-11-10-fase-3-login.md). The password is typed twice without being
// shown; piped input is read as one line, for tests. Works on any database, since this
// is how real accounts get their first password. Never prints a password or a hash.

import { createInterface } from "node:readline";
import type postgres from "postgres";
import { hashPassword } from "../lib/auth/password";
import { withDatabase } from "./db-client.mjs";

const MIN_LENGTH = 8;

/** Reads one line from the terminal without echoing it. */
function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    process.stdout.write(prompt);
    let text = "";
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          input.setRawMode(false);
          input.pause();
          input.off("data", onData);
          process.stdout.write("\n");
          resolve(text);
          return;
        }
        if (char === "\u0003") {
          input.setRawMode(false);
          input.pause();
          input.off("data", onData);
          process.stdout.write("\n");
          reject(new Error("Cancelled."));
          return;
        }
        // Remove a whole character, not half of an emoji's surrogate pair.
        if (char === "\u007f" || char === "\b") text = Array.from(text).slice(0, -1).join("");
        // Arrow keys, Esc, Ctrl+Z and the like would otherwise end up in the password unseen.
        else if (char >= " ") text += char;
      }
    };
    input.on("data", onData);
  });
}

/** Reads lines from piped input: the password, then the same password again (one line counts as both). */
async function readPiped(): Promise<[string, string]> {
  const lines: string[] = [];
  for await (const line of createInterface({ input: process.stdin })) lines.push(line);
  return [lines[0] ?? "", lines[1] ?? lines[0] ?? ""];
}

async function readPassword(): Promise<[string, string]> {
  if (!process.stdin.isTTY) return readPiped();
  const first = await askHidden("New password: ");
  const second = await askHidden("Type it again: ");
  return [first, second];
}

function fail(message: string) {
  console.error(message);
  process.exitCode = 1;
}

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) return fail("Usage: npm run db:set-password <email>");

  let password: string;
  try {
    const [first, second] = await readPassword();
    if (first !== second) return fail("The two passwords differ. Nothing was changed.");
    if (first.length < MIN_LENGTH) return fail(`Use at least ${MIN_LENGTH} characters. Nothing was changed.`);
    password = first;
  } catch (error) {
    return fail(`${(error as Error).message} Nothing was changed.`);
  }

  let hash: string;
  try {
    hash = await hashPassword(password);
  } catch (error) {
    return fail(`${(error as Error).message} Nothing was changed.`);
  }
  await withDatabase(async (sql: postgres.Sql) => {
    console.log(`Database ${sql.options.host[0]}:${sql.options.port[0]}/${sql.options.database}`);
    // Emails are unique only as typed, so "Rafi@x" and "rafi@x" could both exist: change
    // exactly one account or none.
    const message = await sql.begin(async (tx) => {
      const found = await tx`select id from users where lower(email) = lower(${email}) for update`;
      if (found.length === 0) return `No account with the email ${email}. Nothing was changed.`;
      if (found.length > 1) return `${found.length} accounts match ${email} when case is ignored. Nothing was changed.`;
      await tx`update users set password_hash = ${hash} where id = ${found[0].id}`;
      return null;
    });
    if (message) return fail(message);
    console.log(`Password set for ${email}.`);
  });
}

// No top-level await: tsx runs .ts files in this package as CommonJS.
void main();
