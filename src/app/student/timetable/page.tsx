import { EmptyState, PageHeader } from "@/components/ui";
import { requireStudentPage } from "@/lib/guard";
import { getStudentByUserId, listStudentTimetable } from "@/lib/data";
import { weekdayName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentTimetablePage() {
  const user = await requireStudentPage();
  const profile = await getStudentByUserId(user.id);
  const rows = profile ? await listStudentTimetable(profile.student.id) : [];

  return (
    <div>
      <PageHeader title="Timetable" description="Weekly class schedule for enrolled courses." />
      {rows.length === 0 ? (
        <EmptyState title="No timetable entries" description="Your college has not published a timetable yet." />
      ) : (
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const items = rows.filter((r) => r.weekday === day);
            if (items.length === 0) return null;
            return (
              <section key={day} className="card p-5">
                <h2 className="mb-3 font-semibold">{weekdayName(day)}</h2>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-medium">{item.courseTitle}</p>
                        <p className="text-sm text-slate-500">
                          {item.courseCode} · {item.room ?? "Room TBA"} · {item.facultyName ?? "Faculty TBA"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-indigo-700">
                        {item.startsAt} – {item.endsAt}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
