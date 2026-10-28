import { randomBytes, scrypt, timingSafeEqual, createHash, createHmac } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hash, "hex");
  if (storedBuf.length !== derived.length) return false;
  return timingSafeEqual(storedBuf, derived);
}

function sessionSecret(): string {
  return process.env.SESSION_SECRET || "campusflow-dev-session-secret-change-me-32b";
}

export function signToken(payload: object, expiresInSeconds = 60 * 60 * 12): string {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    iat: Math.floor(Date.now() / 1000),
  };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken<T>(token: string): T | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", sessionSecret()).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as T & {
      exp?: number;
    };
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
