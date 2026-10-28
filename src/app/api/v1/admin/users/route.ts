import { asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { userRoles, users } from "@/db/schema";
import { created, ok, paginationMeta, parsePagination, validationError } from "@/lib/api";
import { apiRequire, handleApiError, HttpError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/crypto";
import { userSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await apiRequire(["platform_admin"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(searchParams);
    const q = searchParams.get("q")?.trim();
    const where = q
      ? or(ilike(users.fullName, `%${q}%`), ilike(users.email, `%${q}%`))
      : undefined;
    const [rows, counted] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          phone: users.phone,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt), asc(users.id))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(where),
    ]);
    const total = counted?.[0]?.count ?? 0;

    const roles = rows.length
      ? await db
          .select()
          .from(userRoles)
          .where(inArray(userRoles.userId, rows.map((user) => user.id)))
      : [];
    const data = rows.map((user) => ({
      ...user,
      roles: roles
        .filter((r) => r.userId === user.id)
        .map((r) => ({ role: r.role, collegeId: r.collegeId })),
    }));
    return ok(data, paginationMeta(total, { page, pageSize }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await apiRequire(["platform_admin"]);
    const parsed = userSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    if (parsed.data.role !== "platform_admin" && !parsed.data.collegeId) {
      throw new HttpError(422, "VALIDATION_ERROR", "College is required for this role.");
    }
    if (!parsed.data.password) {
      throw new HttpError(422, "VALIDATION_ERROR", "Password is required.");
    }

    const [user] = await db
      .insert(users)
      .values({
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
        passwordHash: await hashPassword(parsed.data.password),
        status: parsed.data.status ?? "active",
      })
      .returning();

    await db.insert(userRoles).values({
      userId: user.id,
      role: parsed.data.role,
      collegeId: parsed.data.role === "platform_admin" ? null : parsed.data.collegeId,
    });

    await writeAudit({
      actor,
      action: "user.create",
      targetType: "user",
      targetId: user.id,
      collegeId: parsed.data.collegeId ?? null,
      metadata: { email: user.email, role: parsed.data.role },
    });

    const { passwordHash: _ignored, ...safe } = user;
    return created(safe);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("users_email_unique")) {
      return validationError("An account with this email already exists.");
    }
    return handleApiError(error);
  }
}
