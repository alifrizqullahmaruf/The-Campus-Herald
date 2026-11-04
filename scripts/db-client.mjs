// Shared by the database scripts (db-check, db-migrate, later db-seed): opens the
// connection from DATABASE_URL, reports failures with a hint, always closes it.
// This is the one place that decides what a script may print about the connection.

import postgres from "postgres";

// What to do for the usual failures, by Node error code or PostgreSQL SQLSTATE.
const HINTS = {
  ECONNREFUSED: "Nothing is listening there. If this is the project's own server, start it with npm run db:start.",
  ENOTFOUND: "The host name in DATABASE_URL does not resolve. Check for typos.",
  // PostgreSQL also answers 28P01 for a user that does not exist, so as not to reveal which.
  "28P01":
    "Wrong user or password. Was CREATE ROLE ... LOGIN run and the password set with \\password? " +
    "Special characters in the password must be URL-encoded.",
  "28000": "That user does not exist or may not log in. Was CREATE ROLE ... LOGIN run?",
  "3D000": "That database does not exist. Was CREATE DATABASE run?",
  // Since PostgreSQL 15 only the database owner may create tables in schema public.
  "42501": "Permission denied. The user must own the database: run ALTER DATABASE side_notes OWNER TO side_notes as a superuser.",
  CONNECT_TIMEOUT: "No answer within 5 s. Check the host and port, or a firewall in between.",
  ERR_INVALID_URL: "DATABASE_URL is not a valid URL. URL-encode special characters in the password (e.g. / as %2F, # as %23).",
};
const BAD_ENCODING_HINT = "The password has a % that is not URL-encoding. Write % itself as %25.";

/**
 * Runs `run(sql)` with a client from DATABASE_URL, then closes it. On failure it
 * prints what went wrong and a hint, and sets a failing exit code.
 *
 * Three rules keep the password out of the output:
 * - A second @ is refused first. It is an unencoded @ in the password, and
 *   postgres.js would read part of the password as the host (and hang on a comma).
 * - The client is created inside `try`: postgres.js parses the URL with `new URL`
 *   and decodeURIComponent, and an uncaught TypeError would be printed with its
 *   `input` property, the whole URL.
 * - Only messages from the PostgreSQL server are printed. Others are reduced to
 *   their code, since a connection error's message names the host.
 */
export async function withDatabase(run) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Run npm run db:setup to create a local server, or see .env.example to use another one.");
    process.exitCode = 1;
    return;
  }
  if (url.split("@").length > 2) {
    console.error("DATABASE_URL has more than one @. Write an @ in the password as %40.");
    process.exitCode = 1;
    return;
  }

  let sql;
  try {
    sql = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });
    await run(sql);
  } catch (error) {
    const detail = error instanceof postgres.PostgresError ? error.message : error.code || error.name;
    console.error(`Database error: ${detail}`);
    const hint = error instanceof URIError ? BAD_ENCODING_HINT : HINTS[error.code];
    if (hint) console.error(hint);
    process.exitCode = 1;
  } finally {
    await sql?.end({ timeout: 5 });
  }
}
