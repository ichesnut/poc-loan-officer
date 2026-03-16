import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { ApplicationList } from "./application-list";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "loans.list")) redirect("/unauthorized");

  const where =
    session.user.role === "admin" || session.user.role === "branch_manager"
      ? {}
      : { officerId: session.user.id };

  const applications = await prisma.loanApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      officer: { select: { id: true, name: true, email: true } },
      borrowers: { where: { isPrimary: true }, take: 1 },
      _count: { select: { borrowers: true, incomes: true, expenses: true, collateral: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Applications</h1>
          <p className="text-muted-foreground">
            Manage loan applications and borrower information.
          </p>
        </div>
      </div>
      <Suspense>
        <ApplicationList
          applications={JSON.parse(JSON.stringify(applications))}
          canCreate={hasPermission(session.user.role, "loans.create")}
        />
      </Suspense>
    </div>
  );
}
