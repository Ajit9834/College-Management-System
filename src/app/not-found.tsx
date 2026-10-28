import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="card max-w-lg p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-slate-600">The page you requested does not exist or has moved.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Go to CampusFlow
        </Link>
      </div>
    </main>
  );
}
