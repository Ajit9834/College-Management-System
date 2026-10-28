import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { JsonForm } from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="card w-full max-w-lg p-10">
          <PageHeader
            title="Reset link missing"
            description="This page needs a valid reset link. Request a new one to continue."
          />
          <Link href="/forgot-password" className="btn btn-primary mt-6">
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="card w-full max-w-lg p-10">
        <PageHeader
          title="Choose a new password"
          description="Pick a password with at least 8 characters. Resetting signs out your other sessions."
        />
        <JsonForm
          action="/api/v1/auth/reset-password"
          submitLabel="Reset password"
          successMessage="Password updated. You can now sign in with your new password."
        >
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </JsonForm>
        <Link href="/" className="btn btn-ghost mt-6">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
