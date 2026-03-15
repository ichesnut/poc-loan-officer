import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { getPermittedTransitions } from "@/lib/workflow";
import { ApplicationDetail } from "./application-detail";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "loans.list")) redirect("/unauthorized");

  const { id } = await params;
  const application = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      officer: { select: { id: true, name: true, email: true } },
      borrowers: { orderBy: { isPrimary: "desc" } },
      incomes: { orderBy: { createdAt: "desc" } },
      expenses: { orderBy: { createdAt: "desc" } },
      collateral: { orderBy: { createdAt: "desc" } },
      offers: { orderBy: { createdAt: "desc" } },
      statusTransitions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!application) notFound();

  if (
    session.user.role !== "admin" &&
    session.user.role !== "branch_manager" &&
    application.officerId !== session.user.id
  ) {
    redirect("/unauthorized");
  }

  const canEdit = hasPermission(session.user.role, "loans.update");
  const canCreateOffers = hasPermission(session.user.role, "offers.create");
  const canReviewOffers = hasPermission(session.user.role, "offers.review");
  const canGenerateOffers = hasPermission(session.user.role, "offers.generate");
  const availableTransitions = getPermittedTransitions(
    application.status,
    session.user.role
  );

  return (
    <ApplicationDetail
      application={JSON.parse(JSON.stringify(application))}
      canEdit={canEdit}
      canCreateOffers={canCreateOffers}
      canReviewOffers={canReviewOffers}
      canGenerateOffers={canGenerateOffers}
      availableTransitions={availableTransitions}
      userRole={session.user.role}
    />
  );
}
