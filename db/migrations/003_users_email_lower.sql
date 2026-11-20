-- One account per email whatever the case (Phase 4 day 5, docs/plans/2026-11-17-fase-4-alur-kerja.md).
-- The login, db:set-password and the author manager match emails with lower(email); this
-- index makes that lookup fast and stops two accounts that differ only in case.
-- Applied migrations are never edited: a later change is a new numbered file.

CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));
