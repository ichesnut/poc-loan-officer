import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { WorklistPipeline } from "./worklist-pipeline";

export default async function WorklistPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "loans.list")) redirect("/unauthorized");

  const where =
    session.user.role === "admin" || session.user.role === "branch_manager"
      ? {}
      : { officerId: session.user.id };

  const applications = await prisma.loanApplication.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      officer: { select: { id: true, name: true, email: true } },
      borrowers: { where: { isPrimary: true }, take: 1 },
      statusTransitions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Fetch all officers for the filter dropdown (admins/managers see all)
  const officers =
    session.user.role === "admin" || session.user.role === "branch_manager"
      ? await prisma.user.findMany({
          where: { role: { in: ["loan_officer", "branch_manager", "admin"] }, isActive: true },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Worklist</h1>
        <p className="text-muted-foreground">
          Pipeline view of loan applications by status.
        </p>
      </div>
      <WorklistPipeline
        applications={JSON.parse(JSON.stringify(applications))}
        officers={JSON.parse(JSON.stringify(officers))}
      />
    </div>
  );
}
