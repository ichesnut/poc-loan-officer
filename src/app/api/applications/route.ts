import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { CreateLoanApplicationSchema } from "@/lib/schemas/loan-application";

export async function GET() {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.list")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  return NextResponse.json(applications);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateLoanApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const application = await prisma.loanApplication.create({
    data: {
      ...parsed.data,
      officerId: session.user.id,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
