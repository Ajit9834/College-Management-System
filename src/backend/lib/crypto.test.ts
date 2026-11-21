import assert from "node:assert/strict";
import test from "node:test";
import { signToken, verifyToken } from "./crypto.ts";

test("requires a configured session secret in production", () => {
  const originalSecret = process.env.SESSION_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  try {
    delete process.env.SESSION_SECRET;
    Reflect.set(process.env, "NODE_ENV", "production");
    assert.throws(
      () => signToken({ userId: "user-1" }),
      /SESSION_SECRET must be set in production/,
    );

    Reflect.set(process.env, "NODE_ENV", "development");
    const developmentToken = signToken({ userId: "user-1" });
    assert.equal(verifyToken<{ userId: string }>(developmentToken)?.userId, "user-1");

    process.env.SESSION_SECRET = "test-session-secret";
    Reflect.set(process.env, "NODE_ENV", "production");
    const productionToken = signToken({ userId: "user-1" });
    assert.equal(verifyToken<{ userId: string }>(productionToken)?.userId, "user-1");
  } finally {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
    if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
  }
});
