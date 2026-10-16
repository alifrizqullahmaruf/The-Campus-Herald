import type { Article, ArticleStatus } from "../types";

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
    coverImage: null,
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
    title: "The new grading policy, explained in five minutes",
    excerpt: "From next semester, coursework counts for more and the final exam counts for less. Here is what that means for you.",
    detail: "The academic board approved the change after two years of complaints that one bad exam day could undo a semester of steady work. Lecturers now have until the end of the month to publish their new weightings.",
    quote: "We wanted a grade to describe a semester, not a single morning.",
    categoryId: 1,
    authorId: 2,
    viewCount: 1840,
    date: "2026-10-12",
  },
  {
    id: 2,
    title: "Inside the lab that never switches off",
    excerpt: "The materials science lab runs experiments around the clock. We spent a night shift with the students who keep it going.",
    detail: "Samples have to be checked every three hours, so the lab keeps a rota of volunteers who sleep on camping mats between readings. Most of them say the quiet is the best part.",
    quote: "At 3 a.m. the whole building hums, and you can hear the machines thinking.",
    categoryId: 1,
    authorId: 2,
    viewCount: 920,
    date: "2026-10-03",
  },
  {
    id: 3,
    title: "Why the library is changing its opening hours",
    excerpt: "The central library will open later on weekdays but stay open until midnight during exam weeks.",
    detail: "Entry data showed the first two hours of the morning were almost empty, while queues formed at closing time every evening in exam season. Staff hours have been moved, not cut.",
    quote: "We followed the footsteps. Students study late, so we stay late.",
    categoryId: 1,
    authorId: 2,
    viewCount: 1310,
    date: "2026-09-24",
  },
  {
    id: 4,
    title: "A first-year guide to the course registration maze",
    excerpt: "Five deadlines, three portals and one advisor signature. A step-by-step guide to getting the classes you want.",
    detail: "Most problems come from registering before the advisor approves the study plan. Do it in the right order and the whole process takes about twenty minutes.",
    quote: "Get the signature first. Everything else is just clicking.",
    categoryId: 1,
    authorId: 2,
    viewCount: 2410,
    date: "2026-09-08",
  },
  // Organisations
  {
    id: 5,
    title: "Student council passes its first budget in two years",
    excerpt: "After two failed votes, the council finally agreed how to split this year's activity fund across forty clubs.",
    detail: "The compromise gives smaller clubs a guaranteed minimum and asks larger ones to apply for event money case by case. Treasurers have until November to submit their plans.",
    quote: "Nobody got everything they asked for, which is how you know it was fair.",
    categoryId: 2,
    authorId: 3,
    viewCount: 1520,
    date: "2026-10-10",
  },
  {
    id: 6,
    title: "How the debate club picks its motions",
    excerpt: "Every Thursday, a shortlist of ten motions becomes one. We watched the vote that decides what the campus argues about.",
    detail: "Members pitch motions in sixty seconds each, then vote twice: once for the most interesting and once for the most balanced. The winner has to clear both rounds.",
    quote: "A good motion makes both sides nervous.",
    categoryId: 2,
    authorId: 3,
    viewCount: 610,
    date: "2026-09-29",
  },
  {
    id: 7,
    title: "Twelve clubs, one hall: planning the activity fair",
    excerpt: "Fitting every club into the sports hall for one afternoon takes a floor plan, a spreadsheet and a lot of tape.",
    detail: "The organising committee starts measuring stalls a month in advance. Clubs with live demos get the corners, and the photography club always asks for the window.",
    quote: "It is a puzzle where every piece has an opinion.",
    categoryId: 2,
    authorId: 3,
    viewCount: 480,
    date: "2026-09-15",
  },
  // Events
  {
    id: 8,
    title: "Campus music night returns to the main field",
    excerpt: "Six student bands, one stage and free entry. Music night is back after a two-year break.",
    detail: "The event moved outdoors to fit more people, with food stalls run by student organisations along the edge of the field. Gates open at six and the first band starts at seven.",
    quote: "We just wanted the field to sound like a campus again.",
    categoryId: 3,
    authorId: 4,
    viewCount: 2980,
    date: "2026-10-14",
  },
  {
    id: 9,
    title: "The career fair, ranked by queue length",
    excerpt: "Forty companies came to campus. We timed every queue so you know where to go first next year.",
    detail: "The longest wait was nearly an hour for a tech company handing out stickers. Some of the shortest queues were for the firms that were actually hiring that week.",
    quote: "The free tote bag line was longer than the interview line.",
    categoryId: 3,
    authorId: 4,
    viewCount: 1730,
    date: "2026-10-06",
  },
  {
    id: 10,
    title: "A quiet film screening that sold out in an hour",
    excerpt: "The film society expected thirty people for a black-and-white classic. Two hundred signed up.",
    detail: "The society moved the screening to the main auditorium and added a second showing. Organisers think a single post shared in class group chats did most of the work.",
    quote: "We printed thirty programmes. We are going to need more paper.",
    categoryId: 3,
    authorId: 4,
    viewCount: 540,
    date: "2026-09-26",
  },
  {
    id: 11,
    title: "What to expect at this year's cultural week",
    excerpt: "Dance, food and a parade of regional costumes. A day-by-day guide to cultural week.",
    detail: "Each faculty hosts one evening, and the closing night brings every performance group onto the same stage. Volunteers are still needed for the food festival.",
    quote: "It is the one week everyone on campus is in the same place.",
    categoryId: 3,
    authorId: 4,
    viewCount: 860,
    date: "2026-09-18",
  },
  // Opinion
  {
    id: 12,
    title: "The canteen queue is a design problem, not a patience problem",
    excerpt: "We do not need more patience at lunchtime. We need a second till and a better floor plan.",
    detail: "Half the queue is waiting to pay, not to order. Splitting the two would cut waiting time without hiring anyone or changing the menu.",
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
    detail: "A short contract listing who does what, by when, and what happens if they do not would turn awkward conversations into a simple check against the page.",
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
    detail: "Many students take weekend shifts to pay for rent and books. Saturday exams force them to choose between income and grades, when weekday slots sit empty.",
    quote: "A timetable is a choice, and this one chooses badly.",
    categoryId: 4,
    authorId: 5,
    viewCount: 1190,
    date: "2026-09-20",
  },
  // Achievements
  {
    id: 15,
    title: "Robotics team takes second place at the national cup",
    excerpt: "A robot built in a borrowed workshop beat twenty-eight universities to reach the final.",
    detail: "The team rebuilt their gripper twice in the week before the competition after it failed a test run. The final came down to a single point.",
    quote: "We lost the final by one point and still could not stop smiling.",
    categoryId: 5,
    authorId: 6,
    viewCount: 2640,
    date: "2026-10-09",
  },
  {
    id: 16,
    title: "Three students win research grants for river clean-up study",
    excerpt: "Their plan to map plastic waste along the river won funding for a full year of fieldwork.",
    detail: "The students will sample the water every month and share the data with the local council. They started the project as a class assignment last year.",
    quote: "It started as homework. Now it is a map the city can use.",
    categoryId: 5,
    authorId: 6,
    viewCount: 1080,
    date: "2026-09-30",
  },
  {
    id: 17,
    title: "Our debaters reach the regional final",
    excerpt: "The debate club's first-year team argued its way through five rounds to the regional final.",
    detail: "Two of the three speakers joined the club only this semester. Their coach says the secret was practising every motion from both sides.",
    quote: "They prepared for the argument they did not want to make.",
    categoryId: 5,
    authorId: 6,
    viewCount: 770,
    date: "2026-09-12",
  },
  {
    id: 18,
    title: "Ten years of the campus choir",
    excerpt: "The campus choir celebrates its tenth anniversary with a concert featuring past members.",
    detail: "More than sixty former singers came back to rehearse with the current choir. The programme mixes the first song they ever performed with new arrangements.",
    quote: "Some of us sang together before we knew each other's names.",
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
