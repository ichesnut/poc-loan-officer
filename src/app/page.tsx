import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Loan Officer</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Internal loan management system. Process applications, manage users, and track loan
        pipelines.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition h-9"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition h-9"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
