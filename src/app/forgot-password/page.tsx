import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { JsonForm } from "@/components/forms";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="card w-full max-w-lg p-10">
        <PageHeader
          title="Reset password"
          description="Enter your account email and we will send a reset link that expires in 30 minutes."
        />
        <JsonForm
          action="/api/v1/auth/forgot-password"
          submitLabel="Send reset link"
          successMessage="If an account exists for that email, a reset link is on its way."
        >
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              autoComplete="email"
              required
            />
          </div>
        </JsonForm>
        <p className="mt-4 text-sm text-slate-600">
          Still locked out? Contact your college office or support@campusflow.edu. Never share
          passwords over email.
        </p>
        <Link href="/" className="btn btn-ghost mt-6">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
