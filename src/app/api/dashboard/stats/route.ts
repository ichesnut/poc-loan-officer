import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.list")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // All users with loans.list see all applications; access gated by permission check.
  const where = {};

  const [applications, statusCounts, recentTransitions] = await Promise.all([
    prisma.loanApplication.findMany({
      where,
      select: {
        id: true,
        status: true,
        requestedAmount: true,
        updatedAt: true,
      },
    }),
    prisma.loanApplication.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
      _sum: { requestedAmount: true },
    }),
    prisma.statusTransition.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        application: {
          select: {
            loanNumber: true,
            borrowers: {
              where: { isPrimary: true },
              take: 1,
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    }),
  ]);

  const totalApplications = applications.length;
  const totalVolume = applications.reduce(
    (sum, app) => sum + Number(app.requestedAmount),
    0
  );

  const now = new Date();
  const avgDaysInStatus =
    totalApplications > 0
      ? applications.reduce((sum, app) => {
          const days =
            (now.getTime() - new Date(app.updatedAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / totalApplications
      : 0;

  const byStatus = statusCounts.map((s) => ({
    status: s.status,
    count: s._count.id,
    volume: Number(s._sum.requestedAmount ?? 0),
  }));

  const activityFeed = recentTransitions.map((t) => {
    const borrower = t.application.borrowers[0];
    return {
      id: t.id,
      loanNumber: t.application.loanNumber,
      borrowerName: borrower
        ? `${borrower.firstName} ${borrower.lastName}`
        : null,
      fromStatus: t.fromStatus,
      toStatus: t.toStatus,
      reason: t.reason,
      createdAt: t.createdAt,
    };
  });

  return NextResponse.json({
    totalApplications,
    totalVolume,
    avgDaysInStatus: Math.round(avgDaysInStatus * 10) / 10,
    byStatus,
    activityFeed,
  });
}
