"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorText } from "@/components/ui";

type Offering = { id: string; label: string };
type Student = { id: string; name: string };
type Assessment = { id: string; title: string; maxMarks: number; publishStatus: string; label: string };

export function AttendanceRegister({
  offerings,
  studentsByOffering,
}: {
  offerings: Offering[];
  studentsByOffering: Record<string, Student[]>;
}) {
  const router = useRouter();
  const [offeringId, setOfferingId] = useState(offerings[0]?.id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const students = useMemo(
    () => studentsByOffering[offeringId] ?? [],
    [studentsByOffering, offeringId],
  );

  async function save() {
    setBusy(true);
    setError("");
    setOk("");
    const sessionRes = await fetch("/api/v1/college/attendance/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offeringId, sessionDate: date, topic }),
    });
    const sessionJson = await sessionRes.json();
    if (!sessionRes.ok) {
      setBusy(false);
      setError(sessionJson.error?.message || "Could not create session.");
      return;
    }
    const records = students.map((s) => ({
      studentId: s.id,
      status: status[s.id] || "present",
    }));
    const recRes = await fetch(
      `/api/v1/college/attendance/sessions/${sessionJson.data.id}/records`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      },
    );
    const recJson = await recRes.json();
    setBusy(false);
    if (!recRes.ok) {
      setError(recJson.error?.message || "Could not save records.");
      return;
    }
    setOk("Attendance saved.");
    router.refresh();
  }

  return (
    <section className="card p-5">
      <h2 className="mb-4 font-semibold">Attendance register</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label" htmlFor="offering">Offering</label>
          <select
            id="offering"
            className="select"
            value={offeringId}
            onChange={(e) => setOfferingId(e.target.value)}
          >
            {offerings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="date">Date</label>
          <input id="date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="topic">Topic</label>
          <input id="topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {students.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2">
            <span className="text-sm font-medium">{s.name}</span>
            <select
              className="select max-w-[160px]"
              value={status[s.id] ?? "present"}
              onChange={(e) => setStatus((prev) => ({ ...prev, [s.id]: e.target.value }))}
              aria-label={`Attendance for ${s.name}`}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>
      {ok ? <p className="mt-2 text-sm text-emerald-700">{ok}</p> : null}
      <button className="btn btn-primary mt-4" onClick={save} disabled={busy || students.length === 0}>
        {busy ? "Saving…" : "Save attendance"}
      </button>
    </section>
  );
}

export function MarksPanel({
  assessments,
  studentsByAssessment,
  canPublish,
}: {
  assessments: Assessment[];
  studentsByAssessment: Record<string, Student[]>;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState(assessments[0]?.id ?? "");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const students = studentsByAssessment[assessmentId] ?? [];
  const current = assessments.find((a) => a.id === assessmentId);

  async function saveMarks() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/v1/college/assessments/${assessmentId}/marks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marks: students.map((s) => ({ studentId: s.id, marks: Number(marks[s.id] || 0) })),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error?.message || "Could not save marks.");
      return;
    }
    setOk("Marks saved.");
    router.refresh();
  }

  async function publish() {
    if (!window.confirm("Publish these results to students? This will be audited.")) return;
    setBusy(true);
    const res = await fetch(`/api/v1/college/assessments/${assessmentId}/publish`, {
      method: "POST",
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error?.message || "Could not publish.");
      return;
    }
    setOk("Results published.");
    router.refresh();
  }

  return (
    <section className="card p-5">
      <h2 className="mb-4 font-semibold">Enter marks</h2>
      <div>
        <label className="label" htmlFor="assessment">Assessment</label>
        <select
          id="assessment"
          className="select"
          value={assessmentId}
          onChange={(e) => setAssessmentId(e.target.value)}
        >
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} ({a.publishStatus})
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 space-y-2">
        {students.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2">
            <span className="text-sm font-medium">{s.name}</span>
            <input
              className="input max-w-[120px]"
              type="number"
              min={0}
              max={current?.maxMarks ?? 100}
              value={marks[s.id] ?? ""}
              onChange={(e) => setMarks((prev) => ({ ...prev, [s.id]: e.target.value }))}
              aria-label={`Marks for ${s.name}`}
            />
          </div>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>
      {ok ? <p className="mt-2 text-sm text-emerald-700">{ok}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={saveMarks} disabled={busy}>
          Save marks
        </button>
        {canPublish ? (
          <button className="btn btn-secondary" onClick={publish} disabled={busy}>
            Publish results
          </button>
        ) : null}
      </div>
    </section>
  );
}
