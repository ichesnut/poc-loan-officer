import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "groups.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { userId } = await req.json();

  const member = await prisma.groupMember.create({
    data: { groupId: id, userId },
  });

  return NextResponse.json(member, { status: 201 });
}
