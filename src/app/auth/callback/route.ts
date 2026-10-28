import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { loadAuthUser, setGoogleSignupCookie, setSessionCookie } from "@/lib/auth";
import { portalForUser } from "@/lib/permissions";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function goTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, new URL(request.url).origin));
}

/**
 * Whether Supabase considers the address confirmed. Google only returns verified
 * addresses, so an OAuth user is normally already confirmed; this is what lets the
 * registration step trust the email rather than a user-editable query parameter.
 */
function isVerified(user: {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  email_verified?: boolean;
}): boolean {
  return Boolean(user.email_confirmed_at || user.confirmed_at || user.email_verified === true);
}

/**
 * Google OAuth callback. Supabase authenticates the Google user, then this route
 * exchanges the authorisation code for a Supabase session, matches the email
 * against the CampusFlow users table and issues the normal `cms_session` cookie
 * so every existing guard keeps working unchanged.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  if (params.get("error")) return goTo(request, "/login?error=google_cancelled");
  const code = params.get("code");
  if (!code) return goTo(request, "/login?error=google_failed");
  if (!isSupabaseConfigured()) return goTo(request, "/login?error=google_not_configured");

  let email: string | null = null;
  let verified = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) return goTo(request, "/login?error=google_failed");
    // Only accept an identity issued by the Google provider.
    const provider = data.user.app_metadata?.provider;
    if (provider && provider !== "google") return goTo(request, "/login?error=google_failed");
    email = data.user.email?.trim().toLowerCase() || null;
    verified = isVerified(data.user);
  } catch {
    return goTo(request, "/login?error=google_failed");
  }

  if (!email) return goTo(request, "/login?error=google_failed");

  await ensureSeeded();
  const [account] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Google sign-in only signs in accounts that already exist in CampusFlow. This
  // route never creates a user or a role, so Google alone can never grant access.
  if (!account) {
    // Carry the Google-verified address to the registration form in a signed
    // cookie. Without it the form stays a plain, unverified email field.
    if (verified) await setGoogleSignupCookie(email);
    return goTo(request, `/register?reason=no_account&email=${encodeURIComponent(email)}`);
  }
  if (account.status !== "active") return goTo(request, "/login?error=account_suspended");

  const authUser = await loadAuthUser(account.id);
  if (!authUser) return goTo(request, "/login?error=google_failed");

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, account.id));

  await setSessionCookie(authUser);
  return goTo(request, portalForUser(authUser) ?? "/");
}
