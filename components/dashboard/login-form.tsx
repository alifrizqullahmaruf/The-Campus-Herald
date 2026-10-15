"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(email: string, password: string): string | null {
  if (!email.trim() || !password) return "Enter your email and password.";
  if (!EMAIL.test(email.trim())) return "That email address does not look right.";
  return null;
}

/**
 * Log-in form. Preview: any well-formed email and password opens the dashboard.
 * Phase 3 replaces the submit handler with a Server Action (bcrypt + session cookie).
 */
export function LoginForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const problem = validateLogin(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
    setError(problem);
    if (!problem) router.push("/dashboard");
  }

  const field = cx(
    "h-12 w-full rounded-inner border-3 bg-surface px-3 outline-none",
    "focus:outline-3 focus:outline-offset-2 focus:outline-cat-events",
    error ? "border-cat-opinion" : "border-ink",
  );

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={error ? errorId : undefined} className="mt-6 space-y-4">
      <div>
        <label htmlFor={emailId} className="mb-1.5 block font-semibold">
          Email
        </label>
        <input id={emailId} name="email" type="email" autoComplete="username" className={field} />
      </div>
      <div>
        <label htmlFor={passwordId} className="mb-1.5 block font-semibold">
          Password
        </label>
        <input id={passwordId} name="password" type="password" autoComplete="current-password" className={field} />
      </div>
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm font-semibold">
          <AlertTriangle aria-hidden="true" className="size-4 text-cat-opinion" strokeWidth={2.5} />
          {error}
        </p>
      )}
      <Button type="submit" className="w-full">
        Log in
      </Button>
    </form>
  );
}
