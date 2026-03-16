import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { UpdateLiabilitySchema } from "@/lib/schemas/loan-application";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; liabilityId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { liabilityId } = await params;
  const body = await req.json();
  const parsed = UpdateLiabilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const liability = await prisma.liability.update({
    where: { id: liabilityId },
    data: parsed.data,
  });

  return NextResponse.json(liability);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; liabilityId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { liabilityId } = await params;
  await prisma.liability.delete({ where: { id: liabilityId } });

  return NextResponse.json({ success: true });
}
