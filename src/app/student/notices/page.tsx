import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireStudentPage } from "@/lib/guard";
import { listNoticesForUser, listUploadNames } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentNoticesPage() {
  const user = await requireStudentPage();
  const notices = await listNoticesForUser(user);
  const attachmentNames = await listUploadNames(
    notices.map((notice) => notice.attachmentId).filter((id): id is string => Boolean(id)),
  );

  return (
    <div>
      <PageHeader title="Notices" description="Announcements published to your college or the whole platform." />
      {notices.length === 0 ? (
        <EmptyState title="No notices" description="New announcements will appear here when published." />
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <article key={notice.id} className="card p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{notice.title}</h2>
                <StatusBadge status={notice.audience} />
              </div>
              <p className="text-sm text-slate-500">{formatDateTime(notice.publishedAt)}</p>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">{notice.body}</p>
              {notice.attachmentId ? (
                <p className="mt-3 text-sm">
                  <a
                    href={`/api/v1/uploads/${notice.attachmentId}`}
                    className="font-medium text-indigo-600"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Attachment: {attachmentNames[notice.attachmentId] ?? "Download"}
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
