"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ErrorText } from "@/components/ui";

export function CollegeRegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ name: string; message: string } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    form.forEach((value, key) => {
      if (typeof value === "string") payload[key] = value.trim() === "" ? null : value.trim();
    });

    const res = await fetch("/api/v1/auth/register-college", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      const details: { path: string; message: string }[] | undefined = json?.error?.details;
      setError(
        details?.length
          ? details.map((d) => d.message).join(" ")
          : json?.error?.message || "Registration failed. Please try again.",
      );
      return;
    }
    setDone({
      name: json?.data?.college?.name ?? "Your college",
      message:
        json?.data?.message ??
        "Your registration was submitted and is awaiting administrator approval.",
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm text-emerald-900">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5" />
          Registration submitted
        </div>
        <p className="mt-2">
          <span className="font-medium">{done.name}</span> has been registered and is
          <span className="font-medium"> pending approval</span>. {done.message}
        </p>
        <p className="mt-2">
          You will be able to sign in to the college portal once a platform administrator
          approves your college.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">College name</label>
          <input id="name" name="name" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Official college email</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Contact number</label>
          <input id="phone" name="phone" className="input" autoComplete="tel" required />
        </div>
        <div>
          <label className="label" htmlFor="contactName">Contact person name</label>
          <input id="contactName" name="contactName" className="input" autoComplete="name" required />
        </div>
        <div>
          <label className="label" htmlFor="website">College website (optional)</label>
          <input id="website" name="website" className="input" placeholder="https://" />
        </div>
        <div>
          <label className="label" htmlFor="universityName">University / affiliation</label>
          <input id="universityName" name="universityName" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="state">State</label>
          <input id="state" name="state" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <input id="city" name="city" className="input" required />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="address">Full college address</label>
          <textarea id="address" name="address" className="input min-h-24" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="input"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>

      <ErrorText>{error}</ErrorText>
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Submitting registration…" : "Submit college registration"}
      </button>
      <p className="text-xs text-slate-500">
        New colleges are reviewed by a platform administrator before the college portal
        becomes available.
      </p>
    </form>
  );
}
