"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ErrorText } from "@/components/ui";

export type CollegeOption = { id: string; name: string; code: string };
export type DepartmentOption = {
  id: string;
  name: string;
  code: string;
  collegeId: string;
};
export type ProgramOption = {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  departmentId: string;
  durationSemesters: number;
};

export function RegisterForm({
  colleges,
  departments,
  programs,
  defaultEmail,
  emailVerifiedByGoogle = false,
}: {
  colleges: CollegeOption[];
  departments: DepartmentOption[];
  programs: ProgramOption[];
  defaultEmail?: string;
  emailVerifiedByGoogle?: boolean;
}) {
  const router = useRouter();
  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const departmentOptions = useMemo(
    () => departments.filter((d) => d.collegeId === collegeId),
    [departments, collegeId],
  );
  const programOptions = useMemo(
    () => programs.filter((p) => p.departmentId === departmentId),
    [programs, departmentId],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    form.forEach((value, key) => {
      if (typeof value === "string") payload[key] = value === "" ? null : value;
    });
    payload.collegeId = collegeId;
    payload.departmentId = departmentId;
    payload.programId = programId;

    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      const details: { path: string; message: string }[] | undefined = json?.error?.details;
      setError(details?.length ? details.map((d) => d.message).join(" ") : json?.error?.message || "Sign-up failed. Please try again.");
      return;
    }
    router.push(json.data?.portal || "/student");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" className="input" autoComplete="name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            autoComplete="email"
            defaultValue={defaultEmail}
            readOnly={emailVerifiedByGoogle}
            required
          />
          {emailVerifiedByGoogle ? (
            <p className="mt-1 text-xs text-emerald-700">
              Verified by Google. This address is linked to the account being created.
            </p>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" className="input" autoComplete="tel" />
        </div>
        <div>
          <label className="label" htmlFor="dateOfBirth">Date of birth (optional)</label>
          <input id="dateOfBirth" name="dateOfBirth" type="date" className="input" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="college">College</label>
          <select
            id="college"
            className="select"
            value={collegeId}
            onChange={(e) => {
              setCollegeId(e.target.value);
              setDepartmentId("");
              setProgramId("");
            }}
            required
          >
            <option value="">Select a college</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="department">Department</label>
          <select
            id="department"
            className="select"
            value={departmentId}
            disabled={!collegeId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setProgramId("");
            }}
            required
          >
            <option value="">Select a department</option>
            {departmentOptions.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="program">Program</label>
          <select
            id="program"
            className="select"
            value={programId}
            disabled={!departmentId}
            onChange={(e) => setProgramId(e.target.value)}
            required
          >
            <option value="">Select a program</option>
            {programOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code}) · {p.durationSemesters} sem
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="registrationNo">Registration number</label>
          <input id="registrationNo" name="registrationNo" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="currentSemester">Current semester</label>
          <input
            id="currentSemester"
            name="currentSemester"
            type="number"
            min={1}
            max={16}
            defaultValue={1}
            className="input"
            required
          />
        </div>
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
      <button className="btn btn-primary w-full" disabled={loading || !programId}>
        {loading ? "Creating account…" : "Create student account"}
      </button>
    </form>
  );
}
