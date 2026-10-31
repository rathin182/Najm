"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6">
      <form className="w-full max-w-md rounded-[2rem] bg-background p-10" onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        setSubmitting(true);
        try {
          const result = await signIn("credentials", { email: email.trim().toLowerCase(), password, redirect: false, redirectTo: "/admin" });
          if (result?.error) setErr("Unable to sign in. Check your email and password, and confirm your account has a password set.");
          else if (result?.url) window.location.assign(result.url);
          else setErr("Sign in could not be completed. Please try again.");
        } catch {
          setErr("Sign in is temporarily unavailable. Please try again in a moment.");
        } finally {
          setSubmitting(false);
        }
      }}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground">N</span>
        <h1 className="mt-8 text-4xl font-medium tracking-tight">Staff <span className="fancy">sign in</span></h1>
        <p className="mt-2 text-muted-foreground">Najm Estate admin panel</p>
        <div className="mt-8 flex flex-col gap-3">
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="username" required />
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" autoComplete="current-password" required />
          {err && <p className="px-4 text-sm text-destructive" role="alert">{err}</p>}
          <button disabled={submitting} className="mt-2 rounded-full bg-primary py-4 text-lg text-primary-foreground transition-colors hover:bg-ink disabled:opacity-60">{submitting ? "Signing in…" : "Sign in"}</button>
        </div>
      </form>
    </div>
  );
}
