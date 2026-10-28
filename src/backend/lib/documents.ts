import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { colleges, feeInvoices, feeTransactions, students, users } from "@/db/schema";
import {
  getStudentById,
  isStudentTaughtByFaculty,
  listStudentAttendance,
  listStudentCourses,
  listStudentResults,
} from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";
import { PdfDocument } from "@/lib/pdf";
import { canAccessCollege, computeGrade, isFacultyScoped, type AuthUser } from "@/lib/permissions";

export type StudentProfile = NonNullable<Awaited<ReturnType<typeof getStudentById>>>;

function money(value: string | number): string {
  return `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value))}`;
}

function percentOf(part: number, total: number): string {
  return total ? `${Math.round((part / total) * 100)}%` : "-";
}

/**
 * Loads a student for document generation, honouring college scope and the
 * faculty "only my students" restriction.
 */
export async function loadStudentForDocument(
  user: AuthUser,
  studentId: string,
): Promise<StudentProfile | null> {
  const profile = await getStudentById(studentId);
  if (!profile || !canAccessCollege(user, profile.student.collegeId)) return null;
  if (isFacultyScoped(user)) {
    const taught = await isStudentTaughtByFaculty(profile.student.id, user.id);
    if (!taught) return null;
  }
  return profile;
}

function drawHeader(doc: PdfDocument, collegeName: string, collegeCode: string, title: string) {
  doc.text(collegeName, { size: 17, bold: true });
  doc.muted(`College code ${collegeCode}`);
  doc.spacer(4);
  doc.text(title, { size: 13, bold: true });
  doc.rule();
  doc.spacer(4);
}

function drawStudentBlock(doc: PdfDocument, profile: StudentProfile) {
  doc.table(
    ["Name", "Registration no", "Program", "Department"],
    [
      [
        profile.userName,
        profile.student.registrationNo,
        `${profile.programName} (${profile.programCode})`,
        profile.departmentName,
      ],
    ],
    [2.4, 2, 2.4, 2.4],
  );
  doc.table(
    ["Semester", "Academic year", "Email", "Phone"],
    [
      [
        `Semester ${profile.student.currentSemester}`,
        profile.student.academicYear,
        profile.userEmail,
        profile.userPhone ?? "-",
      ],
    ],
    [1.7, 1.9, 3.4, 2],
  );
}

function drawFooter(doc: PdfDocument) {
  doc.spacer(12);
  doc.rule();
  doc.muted(`Generated ${formatDateTime(new Date())} · CampusFlow`);
}

export async function buildTranscript(profile: StudentProfile): Promise<Buffer> {
  const [results, courses, attendance] = await Promise.all([
    listStudentResults(profile.student.id),
    listStudentCourses(profile.student.id),
    listStudentAttendance(profile.student.id),
  ]);

  const doc = new PdfDocument();
  drawHeader(doc, profile.collegeName, profile.collegeCode, "Academic Transcript");
  drawStudentBlock(doc, profile);

  doc.heading("Published results");
  doc.table(
    ["Course", "Assessment", "Max", "Obtained", "Grade", "Exam date"],
    results.map((row) => [
      row.courseCode,
      row.title,
      String(row.maxMarks),
      String(Number(row.marks)),
      row.grade ?? "-",
      formatDate(row.examDate),
    ]),
    [1.6, 3.2, 1, 1.4, 1, 1.8],
  );

  const totalMax = results.reduce((sum, row) => sum + Number(row.maxMarks), 0);
  const totalMarks = results.reduce((sum, row) => sum + Number(row.marks), 0);
  doc.spacer(6);
  doc.text(`Assessments recorded: ${results.length}`, { size: 10, bold: true });
  doc.text(
    `Aggregate: ${totalMarks} / ${totalMax} (${percentOf(totalMarks, totalMax)}) · Overall grade ${computeGrade(totalMarks, totalMax)}`,
    { size: 10 },
  );
  doc.text(`Courses enrolled: ${courses.length}`, { size: 10 });

  doc.heading("Attendance summary");
  doc.table(
    ["Course", "Present", "Sessions", "Attendance %"],
    attendance.summary.map((row) => [
      `${row.courseCode} · ${row.courseTitle}`,
      String(row.present),
      String(row.total),
      percentOf(row.present, row.total),
    ]),
    [4, 1.2, 1.2, 1.6],
  );

  drawFooter(doc);
  return doc.build("Academic Transcript");
}

export async function buildReportCard(profile: StudentProfile): Promise<Buffer> {
  const [courses, results, attendance] = await Promise.all([
    listStudentCourses(profile.student.id),
    listStudentResults(profile.student.id),
    listStudentAttendance(profile.student.id),
  ]);

  const doc = new PdfDocument();
  drawHeader(doc, profile.collegeName, profile.collegeCode, "Student Report Card");
  drawStudentBlock(doc, profile);

  doc.heading("Course performance");
  const rows = courses.map((course) => {
    const courseResults = results.filter((row) => row.courseCode === course.courseCode);
    const obtained = courseResults.reduce((sum, row) => sum + Number(row.marks), 0);
    const max = courseResults.reduce((sum, row) => sum + Number(row.maxMarks), 0);
    const att = attendance.summary.find((row) => row.courseCode === course.courseCode);
    return [
      `${course.courseCode} · ${course.courseTitle}`,
      String(course.credits),
      courseResults.length ? `${obtained} / ${max}` : "-",
      percentOf(obtained, max),
      courseResults.length ? computeGrade(obtained, max) : "-",
      att ? percentOf(att.present, att.total) : "-",
    ];
  });
  doc.table(
    ["Course", "Credits", "Marks", "Score", "Grade", "Attendance"],
    rows,
    [3.4, 1, 1.4, 1, 1, 1.4],
  );

  const totalMax = results.reduce((sum, row) => sum + Number(row.maxMarks), 0);
  const totalMarks = results.reduce((sum, row) => sum + Number(row.marks), 0);
  doc.spacer(6);
  doc.text(
    `Overall: ${totalMarks} / ${totalMax} (${percentOf(totalMarks, totalMax)}) · Grade ${computeGrade(totalMarks, totalMax)}`,
    { size: 10, bold: true },
  );

  doc.heading("Assessment detail");
  doc.table(
    ["Course", "Assessment", "Marks", "Grade", "Exam date"],
    results.map((row) => [
      row.courseCode,
      row.title,
      `${Number(row.marks)} / ${row.maxMarks}`,
      row.grade ?? "-",
      formatDate(row.examDate),
    ]),
    [1.6, 3.6, 1.6, 1, 1.8],
  );

  drawFooter(doc);
  return doc.build("Student Report Card");
}

export async function buildReceipt(
  invoiceId: string,
  collegeId: string,
): Promise<{ filename: string; buffer: Buffer } | null> {
  const [invoice] = await db
    .select()
    .from(feeInvoices)
    .where(and(eq(feeInvoices.id, invoiceId), eq(feeInvoices.collegeId, collegeId)))
    .limit(1);
  if (!invoice) return null;

  const [student] = await db
    .select({ fullName: users.fullName, registrationNo: students.registrationNo })
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(students.id, invoice.studentId))
    .limit(1);
  const [college] = await db.select().from(colleges).where(eq(colleges.id, collegeId)).limit(1);
  const payments = await db
    .select()
    .from(feeTransactions)
    .where(eq(feeTransactions.invoiceId, invoice.id))
    .orderBy(desc(feeTransactions.recordedAt));

  const paid = payments.reduce((sum, row) => sum + Number(row.amount), 0);
  const total = Number(invoice.amount);
  const balance = total - paid;

  const doc = new PdfDocument();
  drawHeader(doc, college?.name ?? "College", college?.code ?? "-", "Fee Receipt");
  doc.table(
    ["Student", "Registration no", "Invoice", "Status"],
    [
      [
        student?.fullName ?? "Student",
        student?.registrationNo ?? "-",
        invoice.title,
        invoice.status.replaceAll("_", " "),
      ],
    ],
    [2.6, 2, 2.8, 1.8],
  );
  doc.table(
    ["Invoice amount", "Amount paid", "Balance", "Due date"],
    [[money(total), money(paid), money(balance), formatDate(invoice.dueDate)]],
    [2, 2, 2, 2],
  );

  doc.heading("Payments received");
  doc.table(
    ["Date", "Reference", "Amount"],
    payments.map((row) => [formatDate(row.recordedAt), row.reference ?? "-", money(row.amount)]),
    [2.4, 5, 2.6],
  );

  doc.spacer(6);
  doc.text(`Total received: ${money(paid)}`, { size: 10, bold: true });
  if (balance > 0) {
    doc.text(`Balance outstanding: ${money(balance)}`, { size: 10 });
  } else {
    doc.text("This invoice is fully settled.", { size: 10 });
  }

  drawFooter(doc);
  return {
    filename: `receipt-${invoice.id.slice(0, 8)}.pdf`,
    buffer: doc.build(`Fee Receipt - ${invoice.title}`),
  };
}
