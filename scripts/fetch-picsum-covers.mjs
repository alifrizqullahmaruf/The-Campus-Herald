// Fills lib/mock/covers.json with Picsum photos for the sample articles:
// `npm run covers:picsum`. No API key needed. Picsum (picsum.photos) serves a
// fixed set of Unsplash photos; each id below was picked by eye from Picsum's
// catalogue to suit the story. The credit links the photographer's name to the
// photo on Unsplash, and "Unsplash" to unsplash.com. Overwrites the file
// (`npm run covers -- --force` switches to photos chosen through the Unsplash API).

import { writeFileSync } from "node:fs";

const OUT_FILE = "lib/mock/covers.json";

// Sample article id (lib/mock/articles.ts) → Picsum photo id.
const PICKS = {
  1: 20, // grading policy: notebook and papers on a desk
  2: 1078, // the lab that never switches off: lit windows at night
  3: 24, // library hours: an open book
  4: 180, // course registration: laptop and notes
  5: 625, // council budget: an empty meeting table
  6: 885, // debate motions: typewriter and papers
  7: 348, // activity fair: a busy hall
  8: 452, // music night: concert crowd
  9: 692, // career fair queues: a crowded concourse
  10: 355, // film screening: old film cameras
  11: 828, // cultural week: fireworks
  12: 1060, // canteen queue: a coffee counter
  13: 7, // group projects: a shared table
  14: 175, // Saturday exams: an alarm clock
  15: 60, // robotics: a desk of gear
  16: 466, // river clean-up: a forest stream
  17: 453, // debate final: a speaker on stage
  18: 1082, // campus choir: hands on a piano
};

function isHttpsOn(url, host) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === host;
  } catch {
    return false;
  }
}

const covers = {};
for (const [article, photo] of Object.entries(PICKS)) {
  const response = await fetch(`https://picsum.photos/id/${photo}/info`);
  if (!response.ok) throw new Error(`${response.status} for Picsum photo ${photo}`);
  const info = await response.json();
  // The photo page ends up as a link in the page, so it must be Unsplash's own.
  if (!isHttpsOn(info.url, "unsplash.com")) throw new Error(`Unexpected link for Picsum photo ${photo}: ${info.url}`);
  covers[article] = {
    // The Picsum loader (components/article/picsum-image.tsx) appends the size.
    url: `https://picsum.photos/id/${photo}`,
    // Picsum gives no profile link, so the name links to the photo page.
    credit: { name: info.author, profileUrl: info.url, photoUrl: "https://unsplash.com/", source: "Unsplash" },
  };
  console.log(`#${article} -> Picsum ${photo} (${info.author})`);
}

writeFileSync(OUT_FILE, `${JSON.stringify(covers, null, 2)}\n`);
console.log(`Wrote ${Object.keys(covers).length} covers to ${OUT_FILE}`);
