import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Set by the dedicated portal sign-in pages. When present the server checks the
  // account really holds a role for that portal before issuing a session, so a
  // frontend redirect can never be the only thing keeping portals apart.
  portal: z.enum(["student", "college", "admin"]).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address").transform((v) => v.trim().toLowerCase()),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(160),
    email: z.string().email("Enter a valid email address").transform((v) => v.trim().toLowerCase()),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    phone: z.string().trim().max(40).optional().nullable(),
    collegeId: z.string().uuid("Select a college"),
    departmentId: z.string().uuid("Select a department"),
    programId: z.string().uuid("Select a program"),
    registrationNo: z.string().trim().min(3, "Enter your registration number").max(40),
    currentSemester: z.coerce.number().int().min(1).max(16),
    dateOfBirth: z.string().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "This reset link is invalid"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const collegeSchema = z.object({
  name: z.string().min(3, "Name is required").max(200),
  code: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[A-Z0-9-]+$/i, "Use letters, numbers, and hyphens only")
    .transform((v) => v.trim().toUpperCase()),
  city: z.string().max(120).optional().nullable(),
  state: z.string().max(120).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  website: z.string().max(255).optional().nullable(),
  contactName: z.string().max(160).optional().nullable(),
  universityName: z.string().max(200).optional().nullable(),
  establishedYear: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  status: z.enum(["active", "pending", "rejected", "suspended", "inactive"]).optional(),
});

/**
 * Public college self-registration. A platform admin must approve the college
 * before its account may sign in to the college portal, so this schema never
 * carries a status, code, or role: those are decided server-side.
 */
export const collegeRegistrationSchema = z
  .object({
    name: z.string().trim().min(3, "Enter the college name").max(200),
    email: z
      .string()
      .trim()
      .email("Enter a valid official college email")
      .transform((v) => v.trim().toLowerCase()),
    contactName: z.string().trim().min(2, "Enter the contact person's name").max(160),
    phone: z.string().trim().min(6, "Enter a contact number").max(40),
    state: z.string().trim().min(2, "Enter the state").max(120),
    city: z.string().trim().min(2, "Enter the city").max(120),
    address: z.string().trim().min(5, "Enter the full college address").max(500),
    website: z.string().trim().max(255).optional().nullable(),
    universityName: z.string().trim().min(2, "Enter the university or affiliation").max(200),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const collegeApprovalSchema = z.object({
  decision: z.enum(["approve", "reject"], { message: "Choose to approve or reject" }),
  note: z.string().trim().max(400).optional().nullable(),
});

export const collegeSettingsSchema = z.object({
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(120).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  website: z.string().trim().max(255).optional().nullable(),
});

export const userSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  fullName: z.string().min(2).max(160),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(8).optional(),
  status: z.enum(["active", "suspended", "deactivated"]).optional(),
  role: z.enum([
    "platform_admin",
    "college_admin",
    "faculty",
    "accounts_staff",
    "student",
  ]),
  collegeId: z.string().uuid().optional().nullable(),
});

export const studentSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(8).optional(),
  registrationNo: z.string().min(3).max(40),
  programId: z.string().uuid(),
  departmentId: z.string().uuid(),
  currentSemester: z.coerce.number().int().min(1).max(16),
  academicYear: z.string().min(4).max(16),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().max(24).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergencyContact: z.string().max(160).optional().nullable(),
  status: z.enum(["active", "inactive", "graduated", "withdrawn"]).optional(),
  photoId: z.string().uuid().optional().nullable(),
});

export const studentProfileUpdateSchema = z.object({
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergencyContact: z.string().max(160).optional().nullable(),
});

export const departmentSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().min(2).max(32).transform((v) => v.trim().toUpperCase()),
  description: z.string().max(500).optional().nullable(),
});

export const programSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().min(2).max(32).transform((v) => v.trim().toUpperCase()),
  departmentId: z.string().uuid(),
  durationSemesters: z.coerce.number().int().min(1).max(16),
});

export const courseSchema = z.object({
  title: z.string().min(2).max(200),
  code: z.string().min(2).max(32).transform((v) => v.trim().toUpperCase()),
  departmentId: z.string().uuid(),
  credits: z.coerce.number().int().min(1).max(12),
  description: z.string().max(1000).optional().nullable(),
});

export const offeringSchema = z.object({
  courseId: z.string().uuid(),
  academicYear: z.string().min(4).max(16),
  semester: z.coerce.number().int().min(1).max(16),
  facultyUserId: z.string().uuid().optional().nullable(),
});

export const enrollmentSchema = z.object({
  offeringId: z.string().uuid(),
  studentId: z.string().uuid(),
});

export const timetableSchema = z.object({
  offeringId: z.string().uuid(),
  weekday: z.coerce.number().int().min(1).max(7),
  startsAt: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  endsAt: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  room: z.string().max(40).optional().nullable(),
});

export const attendanceSessionSchema = z.object({
  offeringId: z.string().uuid(),
  sessionDate: z.string().min(8),
  topic: z.string().max(200).optional().nullable(),
});

export const attendanceSessionUpdateSchema = z.object({
  sessionDate: z.string().min(8).optional(),
  topic: z.string().max(200).optional().nullable(),
});

export const attendanceRecordsSchema = z.object({
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["present", "absent", "late", "excused"]),
      notes: z.string().max(240).optional().nullable(),
    }),
  ),
});

export const assessmentSchema = z.object({
  offeringId: z.string().uuid(),
  title: z.string().min(2).max(160),
  maxMarks: z.coerce.number().int().min(1).max(1000),
  examDate: z.string().optional().nullable(),
});

export const resultMarksSchema = z.object({
  marks: z.array(
    z.object({
      studentId: z.string().uuid(),
      marks: z.coerce.number().min(0),
    }),
  ),
});

export const feeInvoiceSchema = z.object({
  studentId: z.string().uuid(),
  title: z.string().min(2).max(160),
  amount: z.coerce.number().min(0),
  dueDate: z.string().min(8),
  status: z.enum(["pending", "paid", "partially_paid", "overdue", "cancelled"]).optional(),
});

export const feePaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  reference: z.string().max(80).optional().nullable(),
  notes: z.string().max(400).optional().nullable(),
});

export const noticeSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(3).max(8000),
  audience: z.enum(["all", "students", "staff"]),
  publishStatus: z.enum(["draft", "published", "archived"]).optional(),
  attachmentId: z.string().uuid().optional().nullable(),
});

export const settingSchema = z.object({
  key: z.string().min(2).max(80),
  value: z.string().max(4000),
});

// Accepts a real boolean or the "true"/"false" strings sent by HTML forms.
const booleanish = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => (typeof v === "boolean" ? v : v === "true"));

const codeField = z
  .string()
  .min(2)
  .max(32)
  .transform((v) => v.trim().toUpperCase())
  .optional();

export const departmentUpdateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  code: codeField,
  description: z.string().max(500).optional().nullable(),
  isActive: booleanish.optional(),
});

export const programUpdateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  code: codeField,
  departmentId: z.string().uuid().optional(),
  durationSemesters: z.coerce.number().int().min(1).max(16).optional(),
  isActive: booleanish.optional(),
});

export const courseUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  code: codeField,
  departmentId: z.string().uuid().optional(),
  credits: z.coerce.number().int().min(1).max(12).optional(),
  description: z.string().max(1000).optional().nullable(),
  isActive: booleanish.optional(),
});

export const offeringUpdateSchema = z.object({
  academicYear: z.string().min(4).max(16).optional(),
  semester: z.coerce.number().int().min(1).max(16).optional(),
  facultyUserId: z.string().uuid().optional().nullable(),
  status: z.enum(["scheduled", "active", "completed", "cancelled"]).optional(),
});

export const enrollmentUpdateSchema = z.object({
  status: z.enum(["enrolled", "withdrawn", "completed"]),
});

export const timetableUpdateSchema = z.object({
  weekday: z.coerce.number().int().min(1).max(7).optional(),
  startsAt: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format").optional(),
  endsAt: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format").optional(),
  room: z.string().max(40).optional().nullable(),
});

export const assessmentUpdateSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  maxMarks: z.coerce.number().int().min(1).max(1000).optional(),
  examDate: z.string().optional().nullable(),
  publishStatus: z.enum(["draft", "published", "archived"]).optional(),
});

export const feeInvoiceUpdateSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  amount: z.coerce.number().min(0).optional(),
  dueDate: z.string().min(8).optional(),
  status: z.enum(["pending", "paid", "partially_paid", "overdue", "cancelled"]).optional(),
});
