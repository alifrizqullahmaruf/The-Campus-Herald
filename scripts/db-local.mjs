// A PostgreSQL server just for this project, run from the installed PostgreSQL 18
// programs and owned by the Windows user, so creating it needs no superuser password
// of the installed server (docs/plans/2026-11-02-fase-2-database.md).
//
//   npm run db:setup   once: creates the server, the user and the database, and writes
//                      DATABASE_URL to .env.local. Refuses to overwrite anything.
//   npm run db:start   turns it on (needed again after a restart of the computer)
//   npm run db:stop    turns it off
//
// The data lives in %LOCALAPPDATA%, not in the project: the project is in OneDrive,
// and syncing a running database's files can corrupt them. It can be rebuilt at any
// time from the migrations and the seed, so the superuser password is not kept.
// The generated passwords are never printed.

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withDatabase } from "./db-client.mjs";

const BIN = process.env.PG_BIN ?? "C:\\Program Files\\PostgreSQL\\18\\bin";
const PORT = 5433;
const ENV_FILE = new URL("../.env.local", import.meta.url);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(join(BIN, "initdb.exe"))) {
  fail(`PostgreSQL programs not found in ${BIN}. Set PG_BIN to its bin folder.`);
}

const HOME = join(process.env.LOCALAPPDATA, "side-notes");
const DATA = join(HOME, "pgdata");
const LOG = join(HOME, "postgres.log");
const PASSWORD_FILE = join(HOME, "initdb-password.tmp");
const REBUILD = `To build it again: npm run db:stop, delete ${HOME}, remove the DATABASE_URL line from .env.local, then npm run db:setup.`;

function program(name, args, options) {
  return spawnSync(join(BIN, `${name}.exe`), args, { windowsHide: true, ...options });
}

function isRunning() {
  const { status, error } = program("pg_ctl", ["status", "-D", DATA], { stdio: "ignore" });
  if (status === 0) return true;
  if (status === 3) return false;
  fail(`Could not tell whether the server is running (${error?.code ?? `pg_ctl exit ${status}`}).`);
}

// stdio is "ignore", not a pipe: the server inherits it, and spawnSync would wait for
// a pipe to close, which is when the server stops.
function startServer() {
  return program("pg_ctl", ["start", "-w", "-D", DATA, "-l", LOG], { stdio: "ignore" }).status === 0;
}

async function setup() {
  // Left behind only if an earlier run was killed during initdb.
  rmSync(PASSWORD_FILE, { force: true });

  const env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  if (env.includes("\0")) fail(".env.local is not UTF-8 (PowerShell's > writes UTF-16). Save it as UTF-8 first. Nothing was changed.");
  if (/^\s*(export\s+)?DATABASE_URL\s*=/m.test(env)) fail(`.env.local already has DATABASE_URL. Nothing was changed. ${REBUILD}`);
  if (existsSync(DATA)) fail(`${DATA} already exists. Nothing was changed. ${REBUILD}`);

  const superuserPassword = randomBytes(24).toString("hex");
  const appPassword = randomBytes(24).toString("hex");

  mkdirSync(HOME, { recursive: true });
  writeFileSync(PASSWORD_FILE, superuserPassword, { mode: 0o600 });
  let initdb;
  try {
    initdb = program(
      "initdb",
      [
        "-D", DATA,
        "-U", "postgres",
        `--pwfile=${PASSWORD_FILE}`,
        "--auth=scram-sha-256",
        "--encoding=UTF8",
        // Unicode-aware lower() and upper() without depending on a Windows locale name.
        "--locale=C",
        "--locale-provider=builtin",
        "--builtin-locale=C.UTF-8",
        "-c", `port=${PORT}`,
        "-c", "listen_addresses=localhost",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } finally {
    rmSync(PASSWORD_FILE, { force: true });
  }
  // Checked after the password file is gone: fail() exits at once, skipping `finally`.
  if (initdb.status !== 0) fail(`initdb failed: ${initdb.stderr || initdb.error?.code || `exit ${initdb.status}`}`);

  // From here the superuser password exists only in this process, so whatever goes
  // wrong, the way out is to start over.
  try {
    if (!startServer()) throw new Error(`The server did not start. See ${LOG}`);

    // Not a superuser, like the owner role on Neon, so permission problems show up here too.
    process.env.DATABASE_URL = `postgres://postgres:${superuserPassword}@localhost:${PORT}/postgres`;
    await withDatabase(async (sql) => {
      // Otherwise a failing `create role` would be written to the log, password included.
      await sql.unsafe("set log_min_error_statement = panic");
      await sql.unsafe(`create role side_notes login password '${appPassword}'`);
      await sql.unsafe("create database side_notes owner side_notes");
    });
    if (process.exitCode) throw new Error("The user and database were not created.");

    const separator = env && !env.endsWith("\n") ? "\n" : "";
    appendFileSync(ENV_FILE, `${separator}DATABASE_URL=postgres://side_notes:${appPassword}@localhost:${PORT}/side_notes\n`);
  } catch (error) {
    fail(`${error.code ?? error.message}\nSetup did not finish. ${REBUILD}`);
  }
  console.log(`Server running on localhost:${PORT}, data in ${DATA}.`);
  console.log("DATABASE_URL written to .env.local. Next: npm run db:migrate");
}

function start() {
  if (!existsSync(DATA)) fail("No server yet. Run npm run db:setup first.");
  if (isRunning()) {
    console.log(`Already running on localhost:${PORT}.`);
    return;
  }
  if (!startServer()) fail(`The server did not start. See ${LOG}`);
  console.log(`Running on localhost:${PORT}.`);
}

function stop() {
  if (!existsSync(DATA) || !isRunning()) {
    console.log("Not running.");
    return;
  }
  const { status } = program("pg_ctl", ["stop", "-w", "-D", DATA], { stdio: "ignore" });
  if (status !== 0) fail(`The server did not stop. See ${LOG}`);
  console.log("Stopped.");
}

const COMMANDS = { setup, start, stop };
const command = COMMANDS[process.argv[2]];
if (!command) fail("Usage: node scripts/db-local.mjs setup|start|stop");
await command();
