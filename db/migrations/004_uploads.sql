-- Who uploaded which cover file (Phase 4 day 6, docs/plans/2026-11-17-fase-4-alur-kerja.md).
-- An article may point only to an upload of its own author that is still recorded here, the
-- row is removed together with the file, and the uploads of the last hour are counted to
-- limit how many one account can make. Applied migrations are never edited.

CREATE TABLE uploads (
    path       VARCHAR(80) PRIMARY KEY,
    owner_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uploads_owner ON uploads (owner_id, created_at);
