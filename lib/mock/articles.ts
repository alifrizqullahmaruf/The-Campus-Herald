import type { Article, ArticleStatus, CoverCredit } from "../types";
// Stock cover photos, filled by `npm run covers` (scripts/fetch-covers.mjs).
import COVERS from "./covers.json";
import { BODIES } from "./bodies";

const covers = COVERS as Record<string, { url: string; credit: CoverCredit }>;

// Fictional articles. Replaced by the articles table in Phase 2.
// Category ids: 1 Academics, 2 Organisations, 3 Events, 4 Opinion, 5 Achievements.

interface Seed {
  id: number;
  title: string;
  excerpt: string;
  categoryId: number;
  authorId: number;
  viewCount: number;
  /** Publication (or creation) date, YYYY-MM-DD. */
  date: string;
  status?: ArticleStatus;
  reviewNote?: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Bodies are written per article in bodies.ts; the excerpt is shown as the lead
// above the body, so a body starts after it.
function bodyOf(id: number): string {
  const body = BODIES[id];
  if (!body) throw new Error(`No body for sample article ${id}`);
  return body;
}

function toArticle(seed: Seed): Article {
  const status = seed.status ?? "published";
  const day = `${seed.date}T08:00:00.000Z`;
  const reviewed = status === "published" || status === "rejected";
  return {
    id: seed.id,
    title: seed.title,
    slug: slugify(seed.title),
    body: bodyOf(seed.id),
    excerpt: seed.excerpt,
    coverImage: covers[seed.id]?.url ?? null,
    coverCredit: covers[seed.id]?.credit ?? null,
    status,
    reviewNote: seed.reviewNote ?? null,
    viewCount: status === "published" ? seed.viewCount : 0,
    authorId: seed.authorId,
    reviewerId: reviewed ? 1 : null,
    categoryId: seed.categoryId,
    createdAt: day,
    submittedAt: status === "draft" ? null : day,
    publishedAt: status === "published" ? day : null,
  };
}

const SEEDS: Seed[] = [
  // Academics
  {
    id: 1,
    title: "What's on the desk of the students who top their year",
    excerpt: "Notebooks, coloured pens and a phone face down. We asked five top students to show us where they actually study.",
    categoryId: 1,
    authorId: 2,
    viewCount: 1840,
    date: "2026-10-12",
  },
  {
    id: 2,
    title: "The science building that never turns its lights off",
    excerpt: "Hundreds of windows stay lit all night. We spent a night shift with the students running experiments that cannot wait for morning.",
    categoryId: 1,
    authorId: 2,
    viewCount: 920,
    date: "2026-10-03",
  },
  {
    id: 3,
    title: "The library's reading room now stays open until midnight",
    excerpt: "From this month, the quiet reading room on the second floor stays open until midnight on weekdays.",
    categoryId: 1,
    authorId: 2,
    viewCount: 1310,
    date: "2026-09-24",
  },
  {
    id: 4,
    title: "A first-year guide to registering for courses online",
    excerpt: "One laptop, one study plan and twenty minutes. A step-by-step guide to the online registration system.",
    categoryId: 1,
    authorId: 2,
    viewCount: 2410,
    date: "2026-09-08",
  },
  // Organisations
  {
    id: 5,
    title: "The student council finally gets a room of its own",
    excerpt: "After years of meeting in borrowed classrooms, the council has a bright meeting room with a long table that clubs can book too.",
    categoryId: 2,
    authorId: 3,
    viewCount: 1520,
    date: "2026-10-10",
  },
  {
    id: 6,
    title: "The writing club that still drafts on typewriters",
    excerpt: "Every Wednesday, a dozen students switch off their laptops and write on three old typewriters donated by a retired lecturer.",
    categoryId: 2,
    authorId: 3,
    viewCount: 610,
    date: "2026-09-29",
  },
  {
    id: 10,
    title: "The photography club puts its vintage cameras on show",
    excerpt: "Forty film cameras, the oldest from the 1950s, are on display in the arts building for the next two weeks.",
    categoryId: 2,
    authorId: 3,
    viewCount: 540,
    date: "2026-09-26",
  },
  // Events
  {
    id: 7,
    title: "Open day brings 3,000 visitors through the main hall",
    excerpt: "Future students and their families packed the main hall and its escalators all day. Here is how volunteers kept the crowd moving.",
    categoryId: 3,
    authorId: 4,
    viewCount: 480,
    date: "2026-09-15",
  },
  {
    id: 8,
    title: "Campus music night returns to the main field",
    excerpt: "Six student bands, one big stage and a crowd with their hands in the air. Music night is back after a two-year break.",
    categoryId: 3,
    authorId: 4,
    viewCount: 2980,
    date: "2026-10-14",
  },
  {
    id: 9,
    title: "The career fair filled the great hall. Here's how it went",
    excerpt: "Forty companies set up under the tall windows of the great hall. We walked every aisle so you know where to go first next year.",
    categoryId: 3,
    authorId: 4,
    viewCount: 1730,
    date: "2026-10-06",
  },
  {
    id: 11,
    title: "Cultural week ends with fireworks over the lake",
    excerpt: "Dance, food, a parade of regional costumes and, for the first time, a fireworks show to close the week.",
    categoryId: 3,
    authorId: 4,
    viewCount: 860,
    date: "2026-09-18",
  },
  // Opinion
  {
    id: 12,
    title: "The coffee queue is a design problem, not a patience problem",
    excerpt: "We do not need more patience before the nine o'clock lecture. We need a second counter at the coffee bar.",
    categoryId: 4,
    authorId: 5,
    viewCount: 3320,
    date: "2026-10-11",
  },
  {
    id: 13,
    title: "Group projects should come with a contract",
    excerpt: "Every group has one person who disappears. A one-page agreement on day one would save everyone.",
    categoryId: 4,
    authorId: 5,
    viewCount: 2150,
    date: "2026-10-01",
  },
  {
    id: 14,
    title: "Stop scheduling exams on Saturday mornings",
    excerpt: "Students who work weekend jobs are paying for a timetable that could easily be fixed.",
    categoryId: 4,
    authorId: 5,
    viewCount: 1190,
    date: "2026-09-20",
  },
  // Achievements
  {
    id: 15,
    title: "The student who built the campus app from a dorm desk",
    excerpt: "A second-year computer science student wrote the new campus app on a borrowed keyboard and a second-hand monitor. It now has 8,000 users.",
    categoryId: 5,
    authorId: 6,
    viewCount: 2640,
    date: "2026-10-09",
  },
  {
    id: 16,
    title: "Three students win research grants for a river clean-up study",
    excerpt: "Their plan to map plastic waste along the river that runs through the campus forest won funding for a full year of fieldwork.",
    categoryId: 5,
    authorId: 6,
    viewCount: 1080,
    date: "2026-09-30",
  },
  {
    id: 17,
    title: "Campus band wins the regional battle of the bands",
    excerpt: "Under one spotlight, a band formed in the music society's rehearsal room beat twelve groups to win the regional final.",
    categoryId: 5,
    authorId: 6,
    viewCount: 770,
    date: "2026-09-12",
  },
  {
    id: 18,
    title: "Music student's piano recital earns a national scholarship",
    excerpt: "A final-year music student played a ninety-minute recital from memory and won a national scholarship for postgraduate study.",
    categoryId: 5,
    authorId: 7,
    viewCount: 450,
    date: "2026-09-02",
  },
  // Not published: used by the author and admin dashboards.
  {
    id: 19,
    title: "Notes from the dean's open forum",
    excerpt: "The dean answered forty questions in ninety minutes. Here are the answers that matter.",
    categoryId: 1,
    authorId: 2,
    viewCount: 0,
    date: "2026-10-14",
    status: "draft",
  },
  {
    id: 20,
    title: "Sports day schedule and where to watch",
    excerpt: "Every match, every venue and the best spots to watch from.",
    categoryId: 3,
    authorId: 4,
    viewCount: 0,
    date: "2026-10-13",
    status: "pending",
  },
  {
    id: 21,
    title: "In defence of the 7 a.m. lecture",
    excerpt: "An unpopular opinion: early lectures are the best lectures.",
    categoryId: 4,
    authorId: 5,
    viewCount: 0,
    date: "2026-10-12",
    status: "pending",
  },
  {
    id: 22,
    title: "Club election results announced",
    excerpt: "New leaders for twelve student clubs were elected this week.",
    categoryId: 2,
    authorId: 3,
    viewCount: 0,
    date: "2026-10-08",
    status: "rejected",
    reviewNote: "Please confirm the vote counts with the election committee and add the source before resubmitting.",
  },
  {
    id: 23,
    title: "Scholarship winners for the new semester",
    excerpt: "Twenty students received merit scholarships this semester.",
    categoryId: 5,
    authorId: 6,
    viewCount: 0,
    date: "2026-10-15",
    status: "draft",
  },
];

export const MOCK_ARTICLES: Article[] = SEEDS.map(toArticle);
