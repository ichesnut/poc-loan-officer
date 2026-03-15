import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { canTransition, getPermittedTransitions } from "@/lib/workflow";
import { TransitionStatusSchema } from "@/lib/schemas/loan-application";
import type { LoanStatus } from "@/generated/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.list")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const application = await prisma.loanApplication.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const transitions = getPermittedTransitions(application.status, session.user.role);
  return NextResponse.json({ currentStatus: application.status, availableTransitions: transitions });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.transition")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = TransitionStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { targetStatus, reason } = parsed.data;

  const application = await prisma.loanApplication.findUnique({
    where: { id },
    select: { status: true, officerId: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check role-based transition permission
  if (!canTransition(application.status, targetStatus as LoanStatus, session.user.role)) {
    return NextResponse.json(
      {
        error: `Cannot transition from ${application.status} to ${targetStatus} with role ${session.user.role}`,
      },
      { status: 403 }
    );
  }

  // Perform transition with audit trail in a transaction
  const [updated] = await prisma.$transaction([
    prisma.loanApplication.update({
      where: { id },
      data: { status: targetStatus as LoanStatus },
    }),
    prisma.statusTransition.create({
      data: {
        applicationId: id,
        fromStatus: application.status,
        toStatus: targetStatus as LoanStatus,
        reason,
        performedById: session.user.id,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
