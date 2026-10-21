import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Only used for small labels; not preloading it leaves bandwidth for the
  // display face, which paints the largest element (LCP) on most pages.
  preload: false,
});

// Display face: Archivo cut down by `npm run fonts` (scripts/subset-fonts.mjs) to the
// one width and the weights the headlines use (125%, 800–900; docs/design.md 2.2),
// 28 KB instead of 88 KB. font-stretch matches the `font-display` utility.
const archivo = localFont({
  src: "./fonts/archivo-display.woff2",
  variable: "--font-archivo",
  weight: "800 900",
  declarations: [{ prop: "font-stretch", value: "125%" }],
});

// Absolute base for link previews (og:image). NEXT_PUBLIC_SITE_URL wins (custom
// domain); on Vercel the production domain is provided automatically.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { siteName: SITE.name },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
