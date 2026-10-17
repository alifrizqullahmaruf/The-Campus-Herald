import {
  CalendarDays,
  GraduationCap,
  MessageSquareQuote,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Category, CategorySlug } from "./types";

export interface CategoryStyle extends Category {
  description: string;
  icon: LucideIcon;
  /** Background utility. Full class names so Tailwind can find them. */
  bgClass: string;
  /** Text colour that passes WCAG AA on bgClass (docs/design.md 2.1). */
  textClass: string;
  /** Same colour as bgClass, for places that cannot use classes (avatars, images). */
  hex: string;
}

// The single source of truth for category colours. Cards, pills, badges and
// search all read from here. Order is the display order.
export const CATEGORIES: readonly CategoryStyle[] = [
  {
    id: 1,
    name: "Academics",
    slug: "academics",
    description: "Lectures, research, exams and the people who run the classrooms.",
    icon: GraduationCap,
    bgClass: "bg-cat-academics",
    textClass: "text-white",
    hex: "#354BF6",
  },
  {
    id: 2,
    name: "Organisations",
    slug: "organisations",
    description: "Student bodies, clubs and the meetings that shape campus life.",
    icon: Users,
    bgClass: "bg-cat-organisations",
    textClass: "text-ink",
    hex: "#4AF5A2",
  },
  {
    id: 3,
    name: "Events",
    slug: "events",
    description: "What is on, what just happened and what is worth turning up for.",
    icon: CalendarDays,
    bgClass: "bg-cat-events",
    textClass: "text-ink",
    hex: "#F9DE43",
  },
  {
    id: 4,
    name: "Opinion",
    slug: "opinion",
    description: "Columns and arguments from students who have something to say.",
    icon: MessageSquareQuote,
    bgClass: "bg-cat-opinion",
    textClass: "text-ink",
    hex: "#F04939",
  },
  {
    id: 5,
    name: "Achievements",
    slug: "achievements",
    description: "Wins, awards and milestones from across the university.",
    icon: Trophy,
    bgClass: "bg-cat-achievements",
    textClass: "text-ink",
    hex: "#B28EF8",
  },
];

export function getCategoryBySlug(slug: string): CategoryStyle | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function getCategoryById(id: number): CategoryStyle {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category id: ${id}`);
  return category;
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORIES.some((category) => category.slug === value);
}
