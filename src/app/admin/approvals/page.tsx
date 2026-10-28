import Link from "next/link";
import { Building2, CalendarClock, Globe, Mail, MapPin, Phone, User } from "lucide-react";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, colleges } from "@/db/schema";
import { PageHeader, StatusBadge } from "@/components/ui";
import { CollegeApprovalActions } from "@/components/college-approval-actions";
import { formatDateTime } from "@/lib/format";
import { requireAdminPage } from "@/lib/guard";

export const dynamic = "force-dynamic";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <span>
        <span className="text-slate-500">{label}: </span>
        <span className="text-slate-900">{value}</span>
      </span>
    </div>
  );
}

/** Latest reviewer note recorded for each college, newest first. */
async function latestReviewNotes() {
  const rows = await db
    .select({
      targetId: auditLogs.targetId,
      metadata: auditLogs.metadata,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(inArray(auditLogs.action, ["college.approve", "college.reject"]))
    .orderBy(desc(auditLogs.createdAt));

  const notes = new Map<string, string>();
  for (const row of rows) {
    if (!row.targetId || notes.has(row.targetId)) continue;
    const note = (row.metadata as { note?: string | null } | null)?.note;
    if (typeof note === "string" && note.trim()) notes.set(row.targetId, note.trim());
  }
  return notes;
}

export default async function AdminApprovalsPage() {
  await requireAdminPage();

  const [rows, notes] = await Promise.all([
    db
      .select()
      .from(colleges)
      .where(inArray(colleges.status, ["pending", "rejected", "active"]))
      .orderBy(desc(colleges.createdAt)),
    latestReviewNotes(),
  ]);

  const pending = rows.filter((r) => r.status === "pending");
  const rejected = rows.filter((r) => r.status === "rejected");
  const approved = rows.filter((r) => r.status === "active");

  return (
    <div>
      <PageHeader
        title="College registration requests"
        description="Review colleges that registered themselves. Until a request is approved, the college account cannot reach any college portal feature."
      />

      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-semibold">
          Pending review{" "}
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {pending.length}
          </span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">No college registrations are awaiting review.</p>
        ) : (
          <ul className="space-y-4">
            {pending.map((college) => (
              <li key={college.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-700" />
                      <p className="font-semibold text-slate-900">{college.name}</p>
                      <StatusBadge status={college.status} />
                      <Link
                        href={`/admin/colleges/${college.id}`}
                        className="text-sm font-medium text-indigo-600"
                      >
                        View full record
                      </Link>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <DetailRow icon={Mail} label="Official email" value={college.email ?? "—"} />
                      <DetailRow
                        icon={User}
                        label="Contact person"
                        value={college.contactName ?? "—"}
                      />
                      <DetailRow icon={Phone} label="Contact number" value={college.phone ?? "—"} />
                      <DetailRow
                        icon={CalendarClock}
                        label="Registered"
                        value={formatDateTime(college.createdAt)}
                      />
                      <DetailRow
                        icon={Building2}
                        label="Affiliation"
                        value={college.universityName ?? "—"}
                      />
                      <DetailRow icon={Globe} label="Website" value={college.website ?? "—"} />
                      <DetailRow
                        icon={MapPin}
                        label="Location"
                        value={[college.city, college.state].filter(Boolean).join(", ") || "—"}
                      />
                      <div className="sm:col-span-2">
                        <DetailRow icon={MapPin} label="Address" value={college.address ?? "—"} />
                      </div>
                    </div>
                  </div>
                  <CollegeApprovalActions collegeId={college.id} collegeName={college.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Approved colleges</h2>
          {approved.length === 0 ? (
            <p className="text-sm text-slate-500">No approved colleges yet.</p>
          ) : (
            <ul className="space-y-3">
              {approved.map((college) => (
                <li key={college.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{college.name}</p>
                    <p className="text-sm text-slate-500">
                      {college.code} · registered {formatDateTime(college.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status="approved" />
                    <Link
                      href={`/admin/colleges/${college.id}`}
                      className="text-sm font-medium text-indigo-600"
                    >
                      Manage
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Rejected applications</h2>
          {rejected.length === 0 ? (
            <p className="text-sm text-slate-500">No rejected applications.</p>
          ) : (
            <ul className="space-y-4">
              {rejected.map((college) => (
                <li key={college.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{college.name}</p>
                      <p className="text-sm text-slate-500">{college.email ?? college.code}</p>
                      <p className="text-xs text-slate-400">
                        Registered {formatDateTime(college.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status="rejected" />
                  </div>
                  {notes.get(college.id) ? (
                    <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
                      <span className="font-medium">Reason: </span>
                      {notes.get(college.id)}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <CollegeApprovalActions
                      collegeId={college.id}
                      collegeName={college.name}
                      compact
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
