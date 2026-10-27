import type { Article, ArticleStatus, CoverCredit } from "../types";
// Stock cover photos, filled by `npm run covers` (scripts/fetch-covers.mjs).
import COVERS from "./covers.json";

const covers = COVERS as Record<string, { url: string; credit: CoverCredit }>;

// Fictional articles. Replaced by the articles table in Phase 2.
// Category ids: 1 Academics, 2 Organisations, 3 Events, 4 Opinion, 5 Achievements.

interface Seed {
  id: number;
  title: string;
  excerpt: string;
  /** Second paragraph, specific to the story. */
  detail: string;
  /** Pull quote shown in the body. */
  quote: string;
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

// The excerpt is shown as the lead above the body, so the body starts after it.
function body(seed: Seed): string {
  return [
    `<p>${seed.detail}</p>`,
    `<blockquote><p>${seed.quote}</p></blockquote>`,
    "<h2>What happens next</h2>",
    "<p>We will keep following the story. Here is what to watch for over the coming weeks:</p>",
    "<ul><li>An official statement from the people involved.</li><li>Reactions from students across faculties.</li><li>A follow-up piece once the numbers are in.</li></ul>",
    "<p>Have something to add? Talk to any member of the student press society on campus.</p>",
  ].join("");
}

function toArticle(seed: Seed): Article {
  const status = seed.status ?? "published";
  const day = `${seed.date}T08:00:00.000Z`;
  const reviewed = status === "published" || status === "rejected";
  return {
    id: seed.id,
    title: seed.title,
    slug: slugify(seed.title),
    body: body(seed),
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
    detail: "None of them owned anything expensive. What they shared was a habit: one notebook per course, a written plan for the week, and the phone face down until the plan was done.",
    quote: "The desk does not make you smart. It just stops you from starting late.",
    categoryId: 1,
    authorId: 2,
    viewCount: 1840,
    date: "2026-10-12",
  },
  {
    id: 2,
    title: "The science building that never turns its lights off",
    excerpt: "Hundreds of windows stay lit all night. We spent a night shift with the students running experiments that cannot wait for morning.",
    detail: "Some samples have to be checked every three hours, so the labs keep a rota of volunteers who sleep on camping mats between readings. From the car park, the building looks like a city that never sleeps.",
    quote: "At 3 a.m. every lit window is someone waiting for a result.",
    categoryId: 1,
    authorId: 2,
    viewCount: 920,
    date: "2026-10-03",
  },
  {
    id: 3,
    title: "The library's reading room now stays open until midnight",
    excerpt: "From this month, the quiet reading room on the second floor stays open until midnight on weekdays.",
    detail: "Entry data showed the room was full every evening and nearly empty in the first hours of the morning, so staff hours have been moved rather than cut. Books can still be borrowed until eight.",
    quote: "We followed the footsteps. Students read late, so we stay late.",
    categoryId: 1,
    authorId: 2,
    viewCount: 1310,
    date: "2026-09-24",
  },
  {
    id: 4,
    title: "A first-year guide to registering for courses online",
    excerpt: "One laptop, one study plan and twenty minutes. A step-by-step guide to the online registration system.",
    detail: "Most problems come from registering before your advisor approves the study plan. Write your choices down first, get the approval, then open the portal: the clicking takes about twenty minutes.",
    quote: "Plan on paper, then click. Never the other way round.",
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
    detail: "The room on the ground floor of the student centre used to store old furniture. Council members painted it themselves over two weekends, and any of the forty clubs can now book it for free.",
    quote: "For the first time we have a table nobody can ask us to leave.",
    categoryId: 2,
    authorId: 3,
    viewCount: 1520,
    date: "2026-10-10",
  },
  {
    id: 6,
    title: "The writing club that still drafts on typewriters",
    excerpt: "Every Wednesday, a dozen students switch off their laptops and write on three old typewriters donated by a retired lecturer.",
    detail: "The club has one rule: no deleting. Whatever goes on the page stays there, and the best pages are pinned to the club noticeboard at the end of each month.",
    quote: "You cannot press undo, so you think before every sentence.",
    categoryId: 2,
    authorId: 3,
    viewCount: 610,
    date: "2026-09-29",
  },
  {
    id: 10,
    title: "The photography club puts its vintage cameras on show",
    excerpt: "Forty film cameras, the oldest from the 1950s, are on display in the arts building for the next two weeks.",
    detail: "Most of the collection was donated by alumni who found the cameras in attics and garages. Club members cleaned and repaired them, and a few still work: visitors can book a guided shoot with a real roll of film.",
    quote: "Every camera here has taken somebody's first photo.",
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
    detail: "Student guides stood at the top and bottom of every escalator, and each faculty ran a tour every half hour. The busiest moment came just after lunch, when four tour groups met in the same hall.",
    quote: "We stopped counting at the doors when the clicker passed three thousand.",
    categoryId: 3,
    authorId: 4,
    viewCount: 480,
    date: "2026-09-15",
  },
  {
    id: 8,
    title: "Campus music night returns to the main field",
    excerpt: "Six student bands, one big stage and a crowd with their hands in the air. Music night is back after a two-year break.",
    detail: "The event moved outdoors to fit more people, with stage lights borrowed from the theatre department and food stalls run by student organisations. Gates open at six and the first band starts at seven.",
    quote: "We just wanted the field to sound like a campus again.",
    categoryId: 3,
    authorId: 4,
    viewCount: 2980,
    date: "2026-10-14",
  },
  {
    id: 9,
    title: "The career fair filled the great hall. Here's how it went",
    excerpt: "Forty companies set up under the tall windows of the great hall. We walked every aisle so you know where to go first next year.",
    detail: "The busiest corner belonged to a tech company handing out stickers, while some of the quietest stands were the firms actually hiring that week. By three o'clock the hall was so full that the doors closed for twenty minutes.",
    quote: "The free tote bag line was longer than the interview line.",
    categoryId: 3,
    authorId: 4,
    viewCount: 1730,
    date: "2026-10-06",
  },
  {
    id: 11,
    title: "Cultural week ends with fireworks over the lake",
    excerpt: "Dance, food, a parade of regional costumes and, for the first time, a fireworks show to close the week.",
    detail: "Each faculty hosted one evening, and the closing night brought every performance group onto the same stage by the lake. When the last song ended, the sky lit up for ten minutes.",
    quote: "It is the one week everyone on campus is in the same place.",
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
    detail: "Half the queue is waiting for slow pour-over coffee while the other half only wants to pay for a bottle of water. Splitting the two would cut waiting time without hiring anyone or changing the menu.",
    quote: "Nobody ever fixed a bottleneck by asking people to be calmer.",
    categoryId: 4,
    authorId: 5,
    viewCount: 3320,
    date: "2026-10-11",
  },
  {
    id: 13,
    title: "Group projects should come with a contract",
    excerpt: "Every group has one person who disappears. A one-page agreement on day one would save everyone.",
    detail: "Most groups plan around a table in the first week, phones and tablets out and everyone full of good intentions. A one-page contract listing who does what, by when, would turn later arguments into a simple check against the page.",
    quote: "Write it down while everyone still likes each other.",
    categoryId: 4,
    authorId: 5,
    viewCount: 2150,
    date: "2026-10-01",
  },
  {
    id: 14,
    title: "Stop scheduling exams on Saturday mornings",
    excerpt: "Students who work weekend jobs are paying for a timetable that could easily be fixed.",
    detail: "Many students take weekend shifts to pay for rent and books. When the alarm goes off at six on a Saturday, they have to choose between income and grades, while weekday slots sit empty.",
    quote: "A timetable is a choice, and this one chooses badly.",
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
    detail: "The app puts timetables, room bookings and the canteen menu in one place. The university's IT office liked it so much that it now runs on the official servers, with the student still keeping the code up to date.",
    quote: "I built it because I was tired of opening four websites before breakfast.",
    categoryId: 5,
    authorId: 6,
    viewCount: 2640,
    date: "2026-10-09",
  },
  {
    id: 16,
    title: "Three students win research grants for a river clean-up study",
    excerpt: "Their plan to map plastic waste along the river that runs through the campus forest won funding for a full year of fieldwork.",
    detail: "The students will sample the water every month and share the data with the local council. They started the project as a class assignment last year.",
    quote: "It started as homework. Now it is a map the city can use.",
    categoryId: 5,
    authorId: 6,
    viewCount: 1080,
    date: "2026-09-30",
  },
  {
    id: 17,
    title: "Campus band wins the regional battle of the bands",
    excerpt: "Under one spotlight, a band formed in the music society's rehearsal room beat twelve groups to win the regional final.",
    detail: "Two of the four members joined only this semester. They played three songs of their own, and the judges singled out the last one, written the night before the final.",
    quote: "We wrote our best song the night before. Please do not tell our lecturers.",
    categoryId: 5,
    authorId: 6,
    viewCount: 770,
    date: "2026-09-12",
  },
  {
    id: 18,
    title: "Music student's piano recital earns a national scholarship",
    excerpt: "A final-year music student played a ninety-minute recital from memory and won a national scholarship for postgraduate study.",
    detail: "She practised six hours a day on the old upright piano in the music society's room, the same one she learned on in her first year. The scholarship covers two years at a conservatory.",
    quote: "That piano has a sticky key. I learned to play around it.",
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
    detail: "Draft: still checking quotes against the recording.",
    quote: "We will publish the full answers online.",
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
    detail: "Finals are on the main field; heats are spread across three courts.",
    quote: "Bring water and a hat.",
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
    detail: "Fewer distractions, shorter canteen queues and a whole afternoon free.",
    quote: "The campus is yours before eight.",
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
    detail: "Turnout was the highest in five years.",
    quote: "Every vote was counted twice.",
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
    detail: "Draft: waiting for the full list from the scholarship office.",
    quote: "Hard work, finally on paper.",
    categoryId: 5,
    authorId: 6,
    viewCount: 0,
    date: "2026-10-15",
    status: "draft",
  },
];

export const MOCK_ARTICLES: Article[] = SEEDS.map(toArticle);
