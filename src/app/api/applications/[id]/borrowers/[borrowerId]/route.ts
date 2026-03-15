import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { UpdateBorrowerSchema } from "@/lib/schemas/loan-application";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; borrowerId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { borrowerId } = await params;
  const body = await req.json();
  const parsed = UpdateBorrowerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.email === "") data.email = undefined;

  const borrower = await prisma.borrower.update({
    where: { id: borrowerId },
    data,
  });

  return NextResponse.json(borrower);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; borrowerId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { borrowerId } = await params;
  await prisma.borrower.delete({ where: { id: borrowerId } });

  return NextResponse.json({ success: true });
}
