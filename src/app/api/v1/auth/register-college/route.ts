import { eq } from "drizzle-orm";
import { db } from "@/db";
import { colleges, userRoles, users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { created, fail, validationError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { collegeRegistrationSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** Builds a short, human-readable college code from the college name. */
function baseCode(name: string) {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "COL";
  const acronym = words.map((w) => w[0]).join("");
  if (acronym.length >= 3) return acronym.slice(0, 8);
  return words.join("").slice(0, 8);
}

/** Finds a code that is not already taken, appending a numeric suffix if needed. */
async function uniqueCode(name: string) {
  const base = baseCode(name);
  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    const [existing] = await db
      .select({ id: colleges.id })
      .from(colleges)
      .where(eq(colleges.code, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
}

/**
 * Public college self-registration.
 *
 * The college and its contact account are created in a single transaction and
 * the college starts in `pending` status. No session is issued here: the
 * contact must wait for a platform admin to approve the college before the
 * college portal becomes reachable.
 */
export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`register-college:${ip}`, 5)) {
      return fail("RATE_LIMITED", "Too many sign-up attempts. Please wait a minute.", 429);
    }

    const parsed = collegeRegistrationSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const data = parsed.data;

    // One official email may back exactly one college and one contact account.
    const [[existingCollege], [existingUser]] = await Promise.all([
      db
        .select({ id: colleges.id })
        .from(colleges)
        .where(eq(colleges.email, data.email))
        .limit(1),
      db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1),
    ]);
    if (existingCollege || existingUser) {
      return validationError("A college or account with this email already exists.");
    }

    const code = await uniqueCode(data.name);
    const passwordHash = await hashPassword(data.password);

    const result = await db.transaction(async (tx) => {
      const [college] = await tx
        .insert(colleges)
        .values({
          name: data.name,
          code,
          email: data.email,
          contactName: data.contactName,
          phone: data.phone,
          state: data.state,
          city: data.city,
          address: data.address,
          website: data.website || null,
          universityName: data.universityName,
          // Self-registered colleges cannot use the portal until approved.
          status: "pending",
          updatedAt: new Date(),
        })
        .returning();

      const [account] = await tx
        .insert(users)
        .values({
          email: data.email,
          fullName: data.contactName,
          phone: data.phone,
          passwordHash,
          status: "active",
        })
        .returning();

      // College admins are only ever created here server-side; the role is
      // never taken from client input, and the college is pending regardless.
      await tx.insert(userRoles).values({
        userId: account.id,
        role: "college_admin",
        collegeId: college.id,
      });

      return { college, account };
    });

    await writeAudit({
      actor: null,
      action: "college.register",
      targetType: "college",
      targetId: result.college.id,
      collegeId: result.college.id,
      metadata: {
        name: result.college.name,
        code: result.college.code,
        contactEmail: data.email,
        contactUserId: result.account.id,
        status: "pending",
        selfRegistered: true,
      },
    });

    return created({
      college: {
        id: result.college.id,
        name: result.college.name,
        code: result.college.code,
        email: result.college.email,
        status: result.college.status,
      },
      message:
        "Your college registration was submitted. An administrator will review and approve it before you can access the college portal.",
    });
  } catch (error) {
    // Drizzle wraps driver errors, so the constraint name sits on the cause.
    const cause = (error as { cause?: unknown } | null)?.cause;
    const message = `${error instanceof Error ? error.message : ""} ${
      cause instanceof Error ? cause.message : ""
    }`;
    if (message.includes("colleges_email_unique")) {
      return validationError("A college with this email already exists.");
    }
    if (message.includes("colleges_code_unique")) {
      return validationError("A college with a similar name already exists. Contact support.");
    }
    if (message.includes("users_email_unique")) {
      return validationError("An account with this email already exists.");
    }
    console.error(error);
    return fail("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
  }
}
