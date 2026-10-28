// Downloads the sample articles' cover photos from Picsum into public/covers/
// and fills lib/mock/covers.json with their local paths: `npm run covers:picsum`.
// No API key needed. Picsum (picsum.photos) serves a fixed set of Unsplash
// photos; each id below was picked by eye from Picsum's catalogue to suit the
// story. The photos are kept in the repo because loading them from Picsum took
// 0.7–0.9 s each (a redirect, then the download); next/image resizes the local
// files. The credit links the photographer's name to the photo on Unsplash, and
// "Unsplash" to unsplash.com. Overwrites both (`npm run covers -- --force`
// switches to photos chosen through the Unsplash API, which stay hotlinked).

import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const OUT_FILE = "lib/mock/covers.json";
const PHOTO_DIR = "public/covers";
// 4:3 at the largest size a cover is shown (docs/design.md).
const WIDTH = 1600;
const HEIGHT = 1200;

// Sample article id (lib/mock/articles.ts) → Picsum photo id.
const PICKS = {
  1: 20, // study desks of top students: notebook and stationery
  2: 1078, // science building at night: lit windows
  3: 24, // library reading room: an open book
  4: 180, // online course registration: laptop and notes
  5: 625, // council's new room: a meeting table
  6: 885, // typewriter writing club: typewriter and papers
  7: 348, // open day: a busy hall with escalators
  8: 452, // music night: concert crowd
  9: 692, // career fair in the great hall: a crowded hall
  10: 355, // photography club's vintage cameras
  11: 828, // cultural week closing: fireworks
  12: 1060, // coffee queue: a pour-over coffee bar
  13: 7, // group project contracts: planning at a table
  14: 175, // Saturday exams: an alarm clock
  15: 60, // campus app built at a dorm desk: keyboard and monitor
  16: 466, // river clean-up study: a forest stream
  17: 453, // battle of the bands: singer and guitarist on stage
  18: 1082, // piano recital scholarship: hands on a piano
};

function isHttpsOn(url, host) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === host;
  } catch {
    return false;
  }
}

// Everything is downloaded first (about 2 MB) and written at the end, so a failed
// download leaves the current photos and covers.json untouched.
const covers = {};
const files = [];
for (const [article, photo] of Object.entries(PICKS)) {
  const response = await fetch(`https://picsum.photos/id/${photo}/info`);
  if (!response.ok) throw new Error(`${response.status} for Picsum photo ${photo}`);
  const info = await response.json();
  // The photo page ends up as a link in the page, so it must be Unsplash's own.
  if (!isHttpsOn(info.url, "unsplash.com")) throw new Error(`Unexpected link for Picsum photo ${photo}: ${info.url}`);

  const image = await fetch(`https://picsum.photos/id/${photo}/${WIDTH}/${HEIGHT}.webp`);
  if (!image.ok || image.headers.get("content-type") !== "image/webp") {
    throw new Error(`${image.status} ${image.headers.get("content-type")} for Picsum photo ${photo}`);
  }
  // The photo id is in the name, so a new pick gets a new URL (no stale caches).
  const file = `${article}-${photo}.webp`;
  files.push({ file, data: Buffer.from(await image.arrayBuffer()) });

  covers[article] = {
    url: `/covers/${file}`,
    // Picsum gives no profile link, so the name links to the photo page.
    credit: { name: info.author, profileUrl: info.url, photoUrl: "https://unsplash.com/", source: "Unsplash" },
  };
  console.log(`#${article} -> Picsum ${photo} (${info.author})`);
}

// Start clean so photos that are no longer picked do not linger.
rmSync(PHOTO_DIR, { recursive: true, force: true });
mkdirSync(PHOTO_DIR, { recursive: true });
for (const { file, data } of files) writeFileSync(`${PHOTO_DIR}/${file}`, data);
writeFileSync(OUT_FILE, `${JSON.stringify(covers, null, 2)}\n`);
console.log(`Wrote ${files.length} photos to ${PHOTO_DIR} and ${Object.keys(covers).length} covers to ${OUT_FILE}`);
