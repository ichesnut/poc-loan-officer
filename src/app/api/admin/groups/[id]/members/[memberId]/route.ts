import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "groups.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await params;
  await prisma.groupMember.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}
