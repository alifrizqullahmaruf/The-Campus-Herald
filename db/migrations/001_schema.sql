-- The stage 06 schema (docs/the-campus-herald.md, "Skema database") plus the columns
-- the site needs (docs/plans/2026-11-02-fase-2-database.md). Applied by `npm run db:migrate`.
-- Applied migrations are never edited: a later change is a new numbered file.

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(10)  NOT NULL CHECK (role IN ('author', 'admin')),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    bio           TEXT         NOT NULL DEFAULT '',
    beat          VARCHAR(100) NOT NULL DEFAULT ''
);

CREATE TABLE categories (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(50) NOT NULL UNIQUE,
    slug  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE articles (
    id                       SERIAL PRIMARY KEY,
    title                    VARCHAR(200) NOT NULL,
    slug                     VARCHAR(220) NOT NULL UNIQUE,
    body                     TEXT         NOT NULL,
    excerpt                  TEXT         NOT NULL DEFAULT '',
    cover_image              TEXT,
    cover_alt                VARCHAR(255),
    cover_credit_name        VARCHAR(100),
    cover_credit_profile_url TEXT,
    cover_credit_photo_url   TEXT,
    cover_credit_source      VARCHAR(50),
    status                   VARCHAR(10)  NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
    review_note              TEXT,
    view_count               INTEGER      NOT NULL DEFAULT 0,
    author_id                INTEGER      NOT NULL REFERENCES users(id),
    reviewer_id              INTEGER      REFERENCES users(id),
    category_id              INTEGER      NOT NULL REFERENCES categories(id),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    submitted_at             TIMESTAMPTZ,
    published_at             TIMESTAMPTZ,
    -- A photo credit is whole or absent, like `coverCredit` in lib/types.ts.
    CONSTRAINT articles_cover_credit_complete CHECK (
        num_nulls(cover_credit_name, cover_credit_profile_url,
                  cover_credit_photo_url, cover_credit_source) IN (0, 4)
    )
);

-- Future features: created now per the spec, empty and unused for the time being.
CREATE TABLE comments (
    id         SERIAL PRIMARY KEY,
    body       TEXT        NOT NULL,
    article_id INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id    INTEGER     REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(50) NOT NULL UNIQUE,
    slug  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE article_tags (
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX idx_articles_list ON articles (status, category_id, published_at DESC);
CREATE INDEX idx_articles_most_read ON articles (status, view_count DESC);
