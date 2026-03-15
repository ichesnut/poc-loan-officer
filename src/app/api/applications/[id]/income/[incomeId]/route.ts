import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { UpdateIncomeSchema } from "@/lib/schemas/loan-application";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; incomeId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { incomeId } = await params;
  const body = await req.json();
  const parsed = UpdateIncomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const income = await prisma.income.update({
    where: { id: incomeId },
    data: parsed.data,
  });

  return NextResponse.json(income);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; incomeId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { incomeId } = await params;
  await prisma.income.delete({ where: { id: incomeId } });

  return NextResponse.json({ success: true });
}
