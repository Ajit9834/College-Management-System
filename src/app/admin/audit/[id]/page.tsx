import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/guard";
import { getAuditLogById } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium break-all">{value || "—"}</dd>
    </div>
  );
}

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const row = await getAuditLogById(id);
  if (!row) notFound();

  return (
    <div>
      <PageHeader title="Audit entry" description={row.action} />
      <Link href="/admin/audit" className="mb-4 inline-block text-sm text-indigo-600">
        ← Back to audit logs
      </Link>
      <section className="card max-w-2xl p-6">
        <dl className="space-y-3 text-sm">
          <Field label="When" value={formatDateTime(row.createdAt)} />
          <Field label="Actor" value={row.actorName ?? "System"} />
          <Field label="Actor email" value={row.actorEmail} />
          <Field label="Action" value={row.action} />
          <Field label="Target type" value={row.targetType} />
          <Field label="Target id" value={row.targetId} />
          <Field label="College id" value={row.collegeId} />
        </dl>
      </section>
      <section className="card mt-6 max-w-2xl p-6">
        <h2 className="mb-3 font-semibold">Metadata</h2>
        <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
          {JSON.stringify(row.metadata ?? {}, null, 2)}
        </pre>
      </section>
    </div>
  );
}
