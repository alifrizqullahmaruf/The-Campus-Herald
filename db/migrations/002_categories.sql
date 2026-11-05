-- The five fixed topics, needed in every database, sample data or not. The ids match
-- lib/categories.ts, which maps them to colours.

INSERT INTO categories (id, name, slug) VALUES
  (1, 'Academics', 'academics'),
  (2, 'Organisations', 'organisations'),
  (3, 'Events', 'events'),
  (4, 'Opinion', 'opinion'),
  (5, 'Achievements', 'achievements');

SELECT setval(pg_get_serial_sequence('categories', 'id'), 5);
