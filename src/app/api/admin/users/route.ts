import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "users.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, role, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: { email, name, role, passwordHash },
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
}
