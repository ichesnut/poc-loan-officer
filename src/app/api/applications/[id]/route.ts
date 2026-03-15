import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { UpdateLoanApplicationSchema } from "@/lib/schemas/loan-application";

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

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Non-admin/manager can only see their own applications
  if (
    session.user.role !== "admin" &&
    session.user.role !== "branch_manager" &&
    application.officerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(application);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateLoanApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const application = await prisma.loanApplication.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(application);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.loanApplication.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
