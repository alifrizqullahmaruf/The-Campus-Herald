import type { Metadata } from "next";
import { BuriedNotesArt } from "@/components/about/buried-notes-art";
import { AuthorCard } from "@/components/author/author-card";
import { Container } from "@/components/layout/container";
import { SectionBand } from "@/components/layout/section-band";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CATEGORIES } from "@/lib/categories";
import { getPublishedArticles } from "@/lib/data/articles";
import { getAuthorProfiles } from "@/lib/data/users";

export const metadata: Metadata = {
  title: "About",
  description: "What Side Notes is, how it relates to The Campus Herald, and how a note goes live.",
};

const STEPS = [
  { title: "An author writes", text: "A Campus Herald member drafts the note, adds images and saves it as often as they like." },
  { title: "An editor checks", text: "The administrator reads every submission and approves it, or sends it back with notes." },
  { title: "Students read", text: "Only approved articles go live, filed in one of five topics and easy to find again." },
];

const STAT_TONES = ["bg-cat-events", "bg-surface", "bg-cat-opinion", "bg-cat-organisations"];

export default async function AboutPage() {
  const [articles, authors] = await Promise.all([getPublishedArticles(), getAuthorProfiles()]);
  const stats = [
    { value: articles.length, label: "Articles published" },
    { value: authors.length, label: "Authors writing" },
    { value: CATEGORIES.length, label: "Topics to browse" },
    { value: 0, label: "Articles live without an editor's check" },
  ];

  return (
    <>
      <Container className="py-14 md:py-20">
        <SectionHeader
          as="h1"
          eyebrow="About us"
          title="Notes from the side of campus."
          aside="Side Notes is the community blog of The Campus Herald, the student press society: the stories, opinions and small wins that do not fit a front page."
        />
      </Container>

      <div className="border-t-3 border-ink">
        <Container className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="aspect-4/3 -rotate-2 overflow-hidden rounded-card border-3 border-ink shadow-hard">
            <BuriedNotesArt />
          </div>
          <div>
            <Eyebrow>Why we built it</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(28px,4vw,48px)] font-black leading-none">
              Group chats bury the news.
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-ink-muted">
              <p>
                For years, campus news lived in WhatsApp groups and on Instagram. Posts were buried within hours,
                nothing could be searched, and anyone could post anything without a second pair of eyes.
              </p>
              <p>
                So the Herald started Side Notes, a blog of its own. Every note sits in one of five topics, stays in the archive
                for good, and is read by an editor before anyone else sees it.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <SectionBand className="bg-cat-events">
        <Container>
          <SectionHeader eyebrow="The workflow" title="How an article goes live." />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-card border-3 border-ink bg-surface p-5 shadow-hard">
                <span className="font-display text-5xl font-black text-ink/50">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-2xl font-black">{step.title}.</h3>
                <p className="mt-2 text-ink-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </SectionBand>

      <section aria-labelledby="numbers-title" className="border-b-3 border-ink bg-cat-academics py-16 text-white md:py-24">
        <Container>
          <Eyebrow>So far</Eyebrow>
          <h2 id="numbers-title" className="mt-2 font-display text-[clamp(32px,5vw,56px)] font-black leading-[0.95]">
            Small blog, loud numbers.
          </h2>
          <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col-reverse rounded-card border-3 border-ink p-4 text-ink shadow-hard ${STAT_TONES[i]} ${i % 2 ? "rotate-1" : "-rotate-1"}`}
              >
                <dt className="mt-1 text-meta">{stat.label}</dt>
                <dd className="font-display text-5xl font-black">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="py-16 md:py-24">
        <SectionHeader
          eyebrow="The writers"
          title="Meet the authors."
          aside={
            <Button href="/authors" variant="secondary" arrow>
              Meet everyone
            </Button>
          }
        />
        <ul className="mt-10 grid gap-4 min-[360px]:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {authors.slice(0, 4).map((author, i) => (
            // Three columns on tablets: the fourth card joins from lg.
            <li key={author.id} className={i === 3 ? "md:max-lg:hidden" : undefined}>
              <AuthorCard author={author} />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
