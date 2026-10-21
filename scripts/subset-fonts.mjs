// Builds a small display font: `npm run fonts` (run once; the output is committed).
//
// Headlines only use Archivo at width 125% and weights 800–900 (docs/design.md
// 2.2), but the Google Fonts file carries every width and weight (±88 KB). This
// downloads Archivo's variable font from the google/fonts repository, pins the
// width axis at 125, keeps weights 800–900, and keeps only the characters the
// site needs. Archivo is licensed under the SIL Open Font License 1.1, which
// allows this; its licence file is saved next to the font.

import { mkdirSync, writeFileSync } from "node:fs";
import subsetFont from "subset-font";

// Pinned to a google/fonts commit (2026-03-03) so a rerun gives the same font.
const REPO = "https://raw.githubusercontent.com/google/fonts/95f4904fc8bcf26d3420fe315560c96417c6dec7/ofl/archivo";
const SOURCE = `${REPO}/Archivo%5Bwdth%2Cwght%5D.ttf`;
const LICENSE = `${REPO}/OFL.txt`;
const OUT_DIR = "app/fonts";

// Basic Latin, Latin-1 and Latin Extended-A (accents, names such as ş ă ł ő),
// general punctuation (– — ‘ ’ “ ” …), € ™ −, arrows (← → …) and ⌘. A character
// outside this set (or missing from Archivo, such as ↗) uses the fallback font.
const ranges = [
  [0x20, 0x7e],
  [0xa0, 0x17f],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2212, 0x2212],
  [0x2010, 0x2027],
  [0x2030, 0x203a],
  [0x2190, 0x21ff],
  [0x2318, 0x2318],
];
const text = ranges.map(([from, to]) => String.fromCodePoint(...Array.from({ length: to - from + 1 }, (_, i) => from + i))).join("");

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

const [source, license] = await Promise.all([download(SOURCE), download(LICENSE)]);
const font = await subsetFont(source, text, {
  targetFormat: "woff2",
  variationAxes: { wdth: 125, wght: { min: 800, max: 900 } },
  // Keep the licence description and URL (name IDs 13, 14) inside the served
  // font, as the OFL asks; the subsetter drops them by default.
  preserveNameIds: [13, 14],
});

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/archivo-display.woff2`, font);
writeFileSync(`${OUT_DIR}/Archivo-OFL.txt`, license);
console.log(`Archivo ${Math.round(source.length / 1024)} KB (ttf) -> ${Math.round(font.length / 1024)} KB (woff2): ${OUT_DIR}/archivo-display.woff2`);
