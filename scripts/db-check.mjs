// Checks the database connection in .env.local: `npm run db:check`
// (docs/plans/2026-11-02-fase-2-database.md). Prints the PostgreSQL version, the
// database and the user; on failure, a hint about what to fix. Never prints
// DATABASE_URL itself, since it holds the password.

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill in the password.");
  process.exit(1);
}

// What to do for the usual failures, by Node error code or PostgreSQL SQLSTATE.
const HINTS = {
  ECONNREFUSED:
    "Nothing is listening there. Is the PostgreSQL service running? " +
    "(Windows: Get-Service postgresql-x64-18; start it with Start-Service in an admin PowerShell.)",
  ENOTFOUND: "The host name in DATABASE_URL does not resolve. Check for typos.",
  // PostgreSQL also answers 28P01 for a user that does not exist, so as not to reveal which.
  "28P01":
    "Wrong user or password. Was CREATE ROLE ... LOGIN run and the password set with \\password? " +
    "Special characters in the password must be URL-encoded.",
  "28000": "That user does not exist or may not log in. Was CREATE ROLE ... LOGIN run?",
  "3D000": "That database does not exist. Was CREATE DATABASE run?",
  CONNECT_TIMEOUT: "No answer within 5 s. Check the host and port, or a firewall in between.",
  ERR_INVALID_URL: "DATABASE_URL is not a valid URL. URL-encode special characters in the password (e.g. / as %2F, # as %23).",
};
const BAD_ENCODING_HINT = "The password has a % that is not URL-encoding. Write % itself as %25.";

// The client is created inside `try`: postgres.js parses the URL with `new URL`
// and decodeURIComponent, and an uncaught TypeError would be printed with its
// `input` property, the whole URL with the password. Only the message is printed.
let sql;
try {
  sql = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });
  const [row] = await sql`
    select current_setting('server_version') as version,
           current_database() as database,
           current_user as username`;
  console.log(`Connected: PostgreSQL ${row.version}, database "${row.database}", user "${row.username}".`);
} catch (error) {
  // A refused connection is an AggregateError (IPv6 and IPv4 tried) with an empty message.
  console.error(`Could not connect: ${error.message || error.code || "unknown error"}`);
  const hint = error instanceof URIError ? BAD_ENCODING_HINT : HINTS[error.code];
  if (hint) console.error(hint);
  process.exitCode = 1;
} finally {
  await sql?.end({ timeout: 5 });
}
