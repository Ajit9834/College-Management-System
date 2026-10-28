"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ErrorText } from "@/components/ui";
import type { LoginPortal } from "@/components/portal-login";

export function LoginForm({
  initialError = "",
  portal,
}: {
  initialError?: string;
  /** Restricts the sign-in to one portal; verified again on the server. */
  portal?: LoginPortal;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        ...(portal ? { portal } : {}),
      }),
    });
    const json = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(json?.error?.message || "Unable to sign in. Please try again.");
      return;
    }
    // The destination comes from the server's role mapping, never from the client.
    router.push(json.data?.portal || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="input pr-11"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-800"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
