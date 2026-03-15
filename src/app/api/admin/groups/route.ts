import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "groups.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const group = await prisma.group.create({ data: { name, description } });
  return NextResponse.json(group, { status: 201 });
}
