import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "users.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.email !== undefined) data.email = body.email;
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password) data.passwordHash = await hash(body.password, 12);

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "users.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
