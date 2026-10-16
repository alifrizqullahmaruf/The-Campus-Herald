import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/dashboard/login-form";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main id="main" className="grid flex-1 place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-8 rounded-card border-3 border-ink bg-surface p-6 shadow-hard">
          <h1 className="font-display text-3xl font-black">Author log in.</h1>
          <p className="mt-1 text-ink-muted">For Campus Herald members who write for Side Notes.</p>
          <LoginForm />
          <p className="mt-5 text-sm text-ink-muted">
            Forgot your password? Ask the administrator to reset it.
          </p>
        </div>
        <p className="mt-6 rounded-inner border-2 border-dashed border-ink bg-paper p-3 text-sm">
          <strong>Preview:</strong> any email and password opens the dashboard. Real accounts arrive with the database.
        </p>
        <p className="mt-6 text-center">
          <Link href="/" className="font-display text-sm font-extrabold underline underline-offset-4">
            ← Back to Side Notes
          </Link>
        </p>
      </div>
    </main>
  );
}
