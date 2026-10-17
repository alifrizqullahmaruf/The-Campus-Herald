// Fetches one Unsplash photo per published sample article and writes
// lib/mock/covers.json. Run once (not on every visit): `npm run covers`.
//
// Needs UNSPLASH_ACCESS_KEY in .env.local (free Unsplash Developer app).
// Follows the Unsplash API guidelines: photos are hotlinked from the URLs the
// API returns, the photographer is credited with UTM links, and the
// download_location endpoint is called for each photo we use.
// Demo apps are limited to 50 requests an hour; this uses 2 per article.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ENV_FILE = ".env.local";
const OUT_FILE = "lib/mock/covers.json";
const UTM = "utm_source=side_notes&utm_medium=referral";

// Search terms per sample article id (lib/mock/articles.ts), chosen from the
// story, not just the topic, so the photo matches what the article is about.
const QUERIES = {
  1: "student exam paper desk",
  2: "science laboratory at night",
  3: "university library students studying",
  4: "student laptop campus registration",
  5: "student council meeting table",
  6: "debate microphone audience",
  7: "university club fair booth",
  8: "outdoor student concert stage",
  9: "career fair booth queue",
  10: "cinema audience screen",
  11: "traditional dance festival",
  12: "cafeteria lunch queue",
  13: "students group project table",
  14: "empty exam hall desks",
  15: "robotics competition robot",
  16: "river plastic cleanup volunteers",
  17: "debate competition stage",
  18: "choir singing concert",
};

function readKey() {
  if (process.env.UNSPLASH_ACCESS_KEY) return process.env.UNSPLASH_ACCESS_KEY;
  if (!existsSync(ENV_FILE)) return null;
  const line = readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("UNSPLASH_ACCESS_KEY="));
  return line ? line.slice("UNSPLASH_ACCESS_KEY=".length).trim().replace(/^["']|["']$/g, "") : null;
}

async function api(url, key) {
  const response = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

const key = readKey();
if (!key) {
  console.error(`Missing UNSPLASH_ACCESS_KEY. Add it to ${ENV_FILE}, then run again.`);
  process.exit(1);
}

const existing = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : {};
const covers = { ...existing };
const usedPhotos = new Set(Object.values(existing).map((c) => c.credit.photoUrl));

for (const [id, query] of Object.entries(QUERIES)) {
  if (covers[id] && !process.argv.includes("--force")) {
    console.log(`#${id} already has a cover, skipping (use --force to refetch)`);
    continue;
  }
  const search = await api(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&content_filter=high`,
    key,
  );
  // First result not already used by another article.
  const photo = search.results.find((p) => !usedPhotos.has(`${p.links.html}?${UTM}`));
  if (!photo) {
    console.warn(`#${id} "${query}": no result`);
    continue;
  }
  // Required by the guidelines when a photo is chosen for use.
  await api(photo.links.download_location, key);
  covers[id] = {
    url: photo.urls.raw,
    credit: {
      name: photo.user.name,
      profileUrl: `${photo.user.links.html}?${UTM}`,
      photoUrl: `${photo.links.html}?${UTM}`,
      source: "Unsplash",
    },
  };
  usedPhotos.add(covers[id].credit.photoUrl);
  console.log(`#${id} "${query}" -> ${photo.user.name}`);
}

writeFileSync(OUT_FILE, `${JSON.stringify(covers, null, 2)}\n`);
console.log(`Wrote ${Object.keys(covers).length} covers to ${OUT_FILE}`);
