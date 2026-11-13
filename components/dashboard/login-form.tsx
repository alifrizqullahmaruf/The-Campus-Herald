"use client";

import { AlertTriangle } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "@/lib/auth/actions";
import { validateLogin } from "@/lib/auth/login-rules";
import { cx } from "@/lib/cx";

const INITIAL: LoginState = { error: null, email: "" };

/**
 * Log-in form. The Server Action `login` (lib/auth/actions.ts) checks the password and
 * sets the session cookie; the browser only catches empty or malformed fields early.
 * Without JavaScript the form still posts to the same action.
 */
export function LoginForm() {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [state, formAction, pending] = useActionState(login, INITIAL);
  // An early hint from the browser, cleared by the next submit.
  const [hint, setHint] = useState<{ error: string; after: LoginState } | null>(null);
  const error = hint && hint.after === state ? hint.error : state.error;
  const passwordRef = useRef<HTMLInputElement>(null);

  // The disabled button loses focus while the form is sent; after a refusal, focus goes to
  // the password (the email is kept), so keyboard users can type it again at once.
  useEffect(() => {
    if (state.error) passwordRef.current?.focus();
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const problem = validateLogin(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
    if (problem) {
      event.preventDefault();
      setHint({ error: problem, after: state });
    } else {
      setHint(null);
    }
  }

  const field = cx(
    "h-12 w-full rounded-inner border-3 bg-surface px-3 outline-none",
    "focus:outline-3 focus:outline-offset-2 focus:outline-cat-events",
    error ? "border-cat-opinion" : "border-ink",
  );

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-describedby={error ? errorId : undefined}
      className="mt-6 space-y-4"
    >
      <div>
        <label htmlFor={emailId} className="mb-1.5 block font-semibold">
          Email
        </label>
        {/* React resets the form after the action, back to this value: the typed email stays. */}
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email}
          className={field}
        />
      </div>
      <div>
        <label htmlFor={passwordId} className="mb-1.5 block font-semibold">
          Password
        </label>
        <input ref={passwordRef} id={passwordId} name="password" type="password" autoComplete="current-password" className={field} />
      </div>
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm font-semibold">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-cat-opinion" strokeWidth={2.5} />
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
