import { db } from "@/db";
import {
  assessments,
  attendanceRecords,
  attendanceSessions,
  auditLogs,
  colleges,
  courseEnrollments,
  courseOfferings,
  courses,
  departments,
  facultyProfiles,
  feeInvoices,
  feeTransactions,
  notices,
  platformSettings,
  programs,
  results,
  students,
  timetableEntries,
  userRoles,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/crypto";
import { computeGrade } from "@/lib/permissions";

const globalForSeed = globalThis as typeof globalThis & {
  __campusflowSeedPromise?: Promise<void>;
};

async function seedOnce() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  const password = await hashPassword("CampusAdmin!23");
  const staffPassword = await hashPassword("CollegeAdmin!23");
  const facultyPassword = await hashPassword("FacultyPass!23");
  const accountsPassword = await hashPassword("AccountsPass!23");
  const studentPassword = await hashPassword("StudentPass!23");

  const [riverside] = await db
    .insert(colleges)
    .values({
      name: "Riverside Institute of Technology",
      code: "RIT",
      city: "Pune",
      state: "Maharashtra",
      address: "12 Riverside Avenue, Kothrud, Pune",
      phone: "+91 20 4000 1200",
      email: "hello@riverside.edu",
      website: "https://riverside.example.edu",
      establishedYear: 1998,
      status: "active",
    })
    .returning();

  const [harbor] = await db
    .insert(colleges)
    .values({
      name: "Harbor Arts College",
      code: "HAC",
      city: "Chennai",
      state: "Tamil Nadu",
      address: "88 Marina Walk, Chennai",
      phone: "+91 44 2800 4400",
      email: "office@harborarts.edu",
      website: "https://harbor.example.edu",
      establishedYear: 2006,
      status: "active",
    })
    .returning();

  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@campusflow.edu",
      passwordHash: password,
      fullName: "Aisha Rahman",
      phone: "+91 98000 00001",
      status: "active",
    })
    .returning();

  const [collegeAdmin] = await db
    .insert(users)
    .values({
      email: "clare.admin@riverside.edu",
      passwordHash: staffPassword,
      fullName: "Clare Mendes",
      phone: "+91 98000 00002",
      status: "active",
    })
    .returning();

  const [faculty] = await db
    .insert(users)
    .values({
      email: "ravi.faculty@riverside.edu",
      passwordHash: facultyPassword,
      fullName: "Dr. Ravi Deshmukh",
      phone: "+91 98000 00003",
      status: "active",
    })
    .returning();

  const [accounts] = await db
    .insert(users)
    .values({
      email: "nina.accounts@riverside.edu",
      passwordHash: accountsPassword,
      fullName: "Nina Kapoor",
      phone: "+91 98000 00004",
      status: "active",
    })
    .returning();

  const [studentUser] = await db
    .insert(users)
    .values({
      email: "arjun.student@riverside.edu",
      passwordHash: studentPassword,
      fullName: "Arjun Mehta",
      phone: "+91 98000 10001",
      status: "active",
    })
    .returning();

  const [studentUser2] = await db
    .insert(users)
    .values({
      email: "meera.student@riverside.edu",
      passwordHash: studentPassword,
      fullName: "Meera Iyer",
      phone: "+91 98000 10002",
      status: "active",
    })
    .returning();

  const [studentUser3] = await db
    .insert(users)
    .values({
      email: "kabir.student@riverside.edu",
      passwordHash: studentPassword,
      fullName: "Kabir Shah",
      phone: "+91 98000 10003",
      status: "active",
    })
    .returning();

  const [harborAdmin] = await db
    .insert(users)
    .values({
      email: "priya.admin@harborarts.edu",
      passwordHash: staffPassword,
      fullName: "Priya Natarajan",
      phone: "+91 98000 20001",
      status: "active",
    })
    .returning();

  const [harborStudentUser] = await db
    .insert(users)
    .values({
      email: "lina.student@harborarts.edu",
      passwordHash: studentPassword,
      fullName: "Lina Fernandez",
      phone: "+91 98000 20002",
      status: "active",
    })
    .returning();

  await db.insert(userRoles).values([
    { userId: admin.id, role: "platform_admin", collegeId: null },
    { userId: collegeAdmin.id, role: "college_admin", collegeId: riverside.id },
    { userId: faculty.id, role: "faculty", collegeId: riverside.id },
    { userId: accounts.id, role: "accounts_staff", collegeId: riverside.id },
    { userId: studentUser.id, role: "student", collegeId: riverside.id },
    { userId: studentUser2.id, role: "student", collegeId: riverside.id },
    { userId: studentUser3.id, role: "student", collegeId: riverside.id },
    { userId: harborAdmin.id, role: "college_admin", collegeId: harbor.id },
    { userId: harborStudentUser.id, role: "student", collegeId: harbor.id },
  ]);

  const [cse] = await db
    .insert(departments)
    .values({
      collegeId: riverside.id,
      name: "Computer Science & Engineering",
      code: "CSE",
      description: "Software, systems, and intelligent computing.",
    })
    .returning();

  const [ece] = await db
    .insert(departments)
    .values({
      collegeId: riverside.id,
      name: "Electronics & Communication",
      code: "ECE",
      description: "Circuits, signals, and embedded systems.",
    })
    .returning();

  const [arts] = await db
    .insert(departments)
    .values({
      collegeId: harbor.id,
      name: "Visual Communication",
      code: "VCOM",
      description: "Design, media, and visual storytelling.",
    })
    .returning();

  const [btechCse] = await db
    .insert(programs)
    .values({
      collegeId: riverside.id,
      departmentId: cse.id,
      name: "B.Tech Computer Science",
      code: "BT-CSE",
      durationSemesters: 8,
    })
    .returning();

  const [btechEce] = await db
    .insert(programs)
    .values({
      collegeId: riverside.id,
      departmentId: ece.id,
      name: "B.Tech Electronics",
      code: "BT-ECE",
      durationSemesters: 8,
    })
    .returning();

  const [bdes] = await db
    .insert(programs)
    .values({
      collegeId: harbor.id,
      departmentId: arts.id,
      name: "B.Des Visual Communication",
      code: "BD-VCOM",
      durationSemesters: 8,
    })
    .returning();

  await db.insert(facultyProfiles).values({
    userId: faculty.id,
    collegeId: riverside.id,
    departmentId: cse.id,
    employeeNo: "RIT-FAC-014",
    title: "Associate Professor",
  });

  const [s1] = await db
    .insert(students)
    .values({
      userId: studentUser.id,
      collegeId: riverside.id,
      programId: btechCse.id,
      departmentId: cse.id,
      registrationNo: "RIT-CSE-2023-041",
      currentSemester: 5,
      academicYear: "2025-2026",
      dateOfBirth: "2004-04-18",
      gender: "Male",
      address: "44 Lakeview Residency, Pune",
      emergencyContact: "Rohit Mehta · +91 98000 11001",
      status: "active",
    })
    .returning();

  const [s2] = await db
    .insert(students)
    .values({
      userId: studentUser2.id,
      collegeId: riverside.id,
      programId: btechCse.id,
      departmentId: cse.id,
      registrationNo: "RIT-CSE-2023-018",
      currentSemester: 5,
      academicYear: "2025-2026",
      dateOfBirth: "2004-11-02",
      gender: "Female",
      address: "9 Palm Grove, Baner, Pune",
      emergencyContact: "Anjali Iyer · +91 98000 11002",
      status: "active",
    })
    .returning();

  const [s3] = await db
    .insert(students)
    .values({
      userId: studentUser3.id,
      collegeId: riverside.id,
      programId: btechEce.id,
      departmentId: ece.id,
      registrationNo: "RIT-ECE-2024-007",
      currentSemester: 3,
      academicYear: "2025-2026",
      dateOfBirth: "2005-01-22",
      gender: "Male",
      address: "21 Oak Lane, Pune",
      emergencyContact: "Sana Shah · +91 98000 11003",
      status: "active",
    })
    .returning();

  const [hs] = await db
    .insert(students)
    .values({
      userId: harborStudentUser.id,
      collegeId: harbor.id,
      programId: bdes.id,
      departmentId: arts.id,
      registrationNo: "HAC-VC-2024-011",
      currentSemester: 3,
      academicYear: "2025-2026",
      dateOfBirth: "2005-07-09",
      gender: "Female",
      address: "15 Shoreline Road, Chennai",
      emergencyContact: "Marco Fernandez · +91 98000 21002",
      status: "active",
    })
    .returning();

  const [dsa] = await db
    .insert(courses)
    .values({
      collegeId: riverside.id,
      departmentId: cse.id,
      code: "CS301",
      title: "Data Structures & Algorithms",
      credits: 4,
      description: "Trees, graphs, complexity, and core algorithmic patterns.",
    })
    .returning();

  const [dbms] = await db
    .insert(courses)
    .values({
      collegeId: riverside.id,
      departmentId: cse.id,
      code: "CS305",
      title: "Database Systems",
      credits: 3,
      description: "Relational modeling, SQL, transactions, and indexing.",
    })
    .returning();

  const [networks] = await db
    .insert(courses)
    .values({
      collegeId: riverside.id,
      departmentId: cse.id,
      code: "CS320",
      title: "Computer Networks",
      credits: 3,
      description: "Protocol stacks, routing, and networked applications.",
    })
    .returning();

  const [signals] = await db
    .insert(courses)
    .values({
      collegeId: riverside.id,
      departmentId: ece.id,
      code: "EC210",
      title: "Signals & Systems",
      credits: 4,
      description: "Time and frequency domain analysis of signals.",
    })
    .returning();

  const [studio] = await db
    .insert(courses)
    .values({
      collegeId: harbor.id,
      departmentId: arts.id,
      code: "VC120",
      title: "Design Studio I",
      credits: 4,
      description: "Foundations of visual composition and critique.",
    })
    .returning();

  const [offDsa] = await db
    .insert(courseOfferings)
    .values({
      courseId: dsa.id,
      collegeId: riverside.id,
      academicYear: "2025-2026",
      semester: 5,
      facultyUserId: faculty.id,
      status: "active",
    })
    .returning();

  const [offDbms] = await db
    .insert(courseOfferings)
    .values({
      courseId: dbms.id,
      collegeId: riverside.id,
      academicYear: "2025-2026",
      semester: 5,
      facultyUserId: faculty.id,
      status: "active",
    })
    .returning();

  const [offNet] = await db
    .insert(courseOfferings)
    .values({
      courseId: networks.id,
      collegeId: riverside.id,
      academicYear: "2025-2026",
      semester: 5,
      facultyUserId: faculty.id,
      status: "active",
    })
    .returning();

  const [offSig] = await db
    .insert(courseOfferings)
    .values({
      courseId: signals.id,
      collegeId: riverside.id,
      academicYear: "2025-2026",
      semester: 3,
      facultyUserId: faculty.id,
      status: "active",
    })
    .returning();

  const [offStudio] = await db
    .insert(courseOfferings)
    .values({
      courseId: studio.id,
      collegeId: harbor.id,
      academicYear: "2025-2026",
      semester: 3,
      status: "active",
    })
    .returning();

  await db.insert(courseEnrollments).values([
    { offeringId: offDsa.id, studentId: s1.id, status: "enrolled" },
    { offeringId: offDbms.id, studentId: s1.id, status: "enrolled" },
    { offeringId: offNet.id, studentId: s1.id, status: "enrolled" },
    { offeringId: offDsa.id, studentId: s2.id, status: "enrolled" },
    { offeringId: offDbms.id, studentId: s2.id, status: "enrolled" },
    { offeringId: offSig.id, studentId: s3.id, status: "enrolled" },
    { offeringId: offStudio.id, studentId: hs.id, status: "enrolled" },
  ]);

  await db.insert(timetableEntries).values([
    {
      offeringId: offDsa.id,
      collegeId: riverside.id,
      weekday: 1,
      startsAt: "09:00",
      endsAt: "10:30",
      room: "CSE-201",
    },
    {
      offeringId: offDbms.id,
      collegeId: riverside.id,
      weekday: 1,
      startsAt: "11:00",
      endsAt: "12:30",
      room: "CSE-110",
    },
    {
      offeringId: offNet.id,
      collegeId: riverside.id,
      weekday: 2,
      startsAt: "09:00",
      endsAt: "10:30",
      room: "LAB-3",
    },
    {
      offeringId: offDsa.id,
      collegeId: riverside.id,
      weekday: 3,
      startsAt: "14:00",
      endsAt: "15:30",
      room: "CSE-201",
    },
    {
      offeringId: offDbms.id,
      collegeId: riverside.id,
      weekday: 4,
      startsAt: "09:00",
      endsAt: "10:30",
      room: "CSE-110",
    },
    {
      offeringId: offNet.id,
      collegeId: riverside.id,
      weekday: 5,
      startsAt: "11:00",
      endsAt: "12:30",
      room: "LAB-3",
    },
    {
      offeringId: offSig.id,
      collegeId: riverside.id,
      weekday: 2,
      startsAt: "14:00",
      endsAt: "15:30",
      room: "ECE-12",
    },
    {
      offeringId: offStudio.id,
      collegeId: harbor.id,
      weekday: 1,
      startsAt: "10:00",
      endsAt: "13:00",
      room: "Studio A",
    },
  ]);

  const [sess1] = await db
    .insert(attendanceSessions)
    .values({
      offeringId: offDsa.id,
      collegeId: riverside.id,
      sessionDate: "2026-03-02",
      topic: "Graph traversals",
      createdBy: faculty.id,
    })
    .returning();
  const [sess2] = await db
    .insert(attendanceSessions)
    .values({
      offeringId: offDsa.id,
      collegeId: riverside.id,
      sessionDate: "2026-03-04",
      topic: "Dynamic programming",
      createdBy: faculty.id,
    })
    .returning();
  const [sess3] = await db
    .insert(attendanceSessions)
    .values({
      offeringId: offDbms.id,
      collegeId: riverside.id,
      sessionDate: "2026-03-03",
      topic: "Normalization",
      createdBy: faculty.id,
    })
    .returning();

  await db.insert(attendanceRecords).values([
    { sessionId: sess1.id, studentId: s1.id, status: "present", markedBy: faculty.id },
    { sessionId: sess1.id, studentId: s2.id, status: "present", markedBy: faculty.id },
    { sessionId: sess2.id, studentId: s1.id, status: "late", markedBy: faculty.id },
    { sessionId: sess2.id, studentId: s2.id, status: "absent", markedBy: faculty.id },
    { sessionId: sess3.id, studentId: s1.id, status: "present", markedBy: faculty.id },
    { sessionId: sess3.id, studentId: s2.id, status: "present", markedBy: faculty.id },
  ]);

  const [midterm] = await db
    .insert(assessments)
    .values({
      offeringId: offDsa.id,
      collegeId: riverside.id,
      title: "DSA Midterm",
      maxMarks: 50,
      publishStatus: "published",
      examDate: "2026-02-18",
      publishedAt: new Date("2026-02-22T10:00:00Z"),
    })
    .returning();

  const [quiz] = await db
    .insert(assessments)
    .values({
      offeringId: offDbms.id,
      collegeId: riverside.id,
      title: "DBMS Quiz 2",
      maxMarks: 20,
      publishStatus: "published",
      examDate: "2026-02-28",
      publishedAt: new Date("2026-03-01T09:00:00Z"),
    })
    .returning();

  await db.insert(assessments).values({
    offeringId: offNet.id,
    collegeId: riverside.id,
    title: "Networks Internal",
    maxMarks: 30,
    publishStatus: "draft",
    examDate: "2026-03-12",
  });

  await db.insert(results).values([
    {
      assessmentId: midterm.id,
      studentId: s1.id,
      marks: "42.00",
      grade: computeGrade(42, 50),
      publishedAt: new Date("2026-02-22T10:00:00Z"),
    },
    {
      assessmentId: midterm.id,
      studentId: s2.id,
      marks: "46.00",
      grade: computeGrade(46, 50),
      publishedAt: new Date("2026-02-22T10:00:00Z"),
    },
    {
      assessmentId: quiz.id,
      studentId: s1.id,
      marks: "17.00",
      grade: computeGrade(17, 20),
      publishedAt: new Date("2026-03-01T09:00:00Z"),
    },
    {
      assessmentId: quiz.id,
      studentId: s2.id,
      marks: "19.00",
      grade: computeGrade(19, 20),
      publishedAt: new Date("2026-03-01T09:00:00Z"),
    },
  ]);

  const [inv1] = await db
    .insert(feeInvoices)
    .values({
      studentId: s1.id,
      collegeId: riverside.id,
      title: "Semester 5 tuition",
      amount: "85000.00",
      dueDate: "2026-01-15",
      status: "paid",
    })
    .returning();

  await db.insert(feeInvoices).values({
    studentId: s1.id,
    collegeId: riverside.id,
    title: "Lab & examination fee",
    amount: "12000.00",
    dueDate: "2026-03-20",
    status: "pending",
  });

  await db.insert(feeInvoices).values({
    studentId: s2.id,
    collegeId: riverside.id,
    title: "Semester 5 tuition",
    amount: "85000.00",
    dueDate: "2026-01-15",
    status: "partially_paid",
  });

  await db.insert(feeTransactions).values({
    invoiceId: inv1.id,
    amount: "85000.00",
    reference: "NEFT-RIT-88421",
    status: "paid",
    recordedBy: accounts.id,
    notes: "Full tuition received",
  });

  await db.insert(notices).values([
    {
      collegeId: riverside.id,
      title: "Midterm results published",
      body: "DSA midterm results are now available in the student portal. Reach out to your faculty advisor for any clarification within five working days.",
      audience: "students",
      publishStatus: "published",
      publishedAt: new Date("2026-02-22T11:00:00Z"),
      createdBy: collegeAdmin.id,
    },
    {
      collegeId: riverside.id,
      title: "Campus Wi-Fi maintenance",
      body: "Network maintenance is scheduled this Saturday 01:00–04:00. Library systems will remain available on the backup link.",
      audience: "all",
      publishStatus: "published",
      publishedAt: new Date("2026-03-01T08:00:00Z"),
      createdBy: collegeAdmin.id,
    },
    {
      collegeId: null,
      title: "Platform update: attendance corrections now audited",
      body: "CampusFlow now records a complete audit trail for attendance corrections and result publication across all colleges.",
      audience: "staff",
      publishStatus: "published",
      publishedAt: new Date("2026-02-10T09:00:00Z"),
      createdBy: admin.id,
    },
    {
      collegeId: harbor.id,
      title: "Studio critique week",
      body: "Design Studio I critiques will run Monday through Wednesday in Studio A. Bring printed boards and process books.",
      audience: "students",
      publishStatus: "published",
      publishedAt: new Date("2026-03-05T07:30:00Z"),
      createdBy: harborAdmin.id,
    },
  ]);

  await db.insert(platformSettings).values([
    { key: "platform_name", value: "CampusFlow" },
    { key: "timezone", value: "Asia/Kolkata" },
    { key: "academic_year", value: "2025-2026" },
    { key: "support_email", value: "support@campusflow.edu" },
  ]);

  await db.insert(auditLogs).values([
    {
      actorUserId: admin.id,
      action: "college.create",
      targetType: "college",
      targetId: riverside.id,
      collegeId: riverside.id,
      metadata: { name: riverside.name },
    },
    {
      actorUserId: collegeAdmin.id,
      action: "results.publish",
      targetType: "assessment",
      targetId: midterm.id,
      collegeId: riverside.id,
      metadata: { title: "DSA Midterm" },
    },
  ]);
}

export async function ensureSeeded() {
  if (!globalForSeed.__campusflowSeedPromise) {
    globalForSeed.__campusflowSeedPromise = seedOnce().catch((error) => {
      globalForSeed.__campusflowSeedPromise = undefined;
      throw error;
    });
  }
  await globalForSeed.__campusflowSeedPromise;
}

export async function seedIfEmpty() {
  await ensureSeeded();
}
