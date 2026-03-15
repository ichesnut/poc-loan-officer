import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { UpdateExpenseSchema } from "@/lib/schemas/loan-application";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { expenseId } = await params;
  const body = await req.json();
  const parsed = UpdateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: parsed.data,
  });

  return NextResponse.json(expense);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { expenseId } = await params;
  await prisma.expense.delete({ where: { id: expenseId } });

  return NextResponse.json({ success: true });
}
