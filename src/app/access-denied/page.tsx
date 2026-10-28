import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="card max-w-lg p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">403</p>
        <h1 className="mt-3 text-3xl font-semibold">Access denied</h1>
        <p className="mt-3 text-slate-600">
          Your account does not have permission to view this page. If you believe this is a
          mistake, contact a platform administrator.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Return home
        </Link>
      </div>
    </main>
  );
}
