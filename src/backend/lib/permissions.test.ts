import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessCollege,
  canAccessStudentRecord,
  canPublishResults,
  computeGrade,
  portalForUser,
  type AuthUser,
} from "./permissions.ts";

function user(partial: Partial<AuthUser> & Pick<AuthUser, "roles">): AuthUser {
  return {
    id: "u1",
    email: "a@example.com",
    fullName: "Test User",
    status: "active",
    phone: null,
    sessionEpoch: 0,
    ...partial,
  };
}

test("computeGrade uses percentage bands", () => {
  assert.equal(computeGrade(45, 50), "A");
  assert.equal(computeGrade(10, 50), "F");
  assert.equal(computeGrade(0, 0), "N/A");
});

test("students cannot access another student's record", () => {
  const student = user({
    id: "s1",
    roles: [{ role: "student", collegeId: "c1" }],
  });
  assert.equal(
    canAccessStudentRecord(student, { id: "st2", userId: "s2", collegeId: "c1" }),
    false,
  );
  assert.equal(
    canAccessStudentRecord(student, { id: "st1", userId: "s1", collegeId: "c1" }),
    true,
  );
});

test("college staff cannot cross college boundaries", () => {
  const staff = user({
    roles: [{ role: "college_admin", collegeId: "c1" }],
  });
  assert.equal(canAccessCollege(staff, "c1"), true);
  assert.equal(canAccessCollege(staff, "c2"), false);
});

test("only college admins publish results", () => {
  const faculty = user({ roles: [{ role: "faculty", collegeId: "c1" }] });
  const admin = user({ roles: [{ role: "college_admin", collegeId: "c1" }] });
  assert.equal(canPublishResults(faculty), false);
  assert.equal(canPublishResults(admin), true);
});

test("portal routing follows assigned roles", () => {
  assert.equal(
    portalForUser(user({ roles: [{ role: "platform_admin", collegeId: null }] })),
    "/admin",
  );
  assert.equal(
    portalForUser(user({ roles: [{ role: "faculty", collegeId: "c1" }] })),
    "/college",
  );
  assert.equal(
    portalForUser(user({ roles: [{ role: "student", collegeId: "c1" }] })),
    "/student",
  );
});
