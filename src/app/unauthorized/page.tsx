import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p className="text-muted-foreground">You do not have permission to access this page.</p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
