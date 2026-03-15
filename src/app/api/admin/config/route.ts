import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "system.config")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key, value } = await req.json();
  if (!key) {
    return NextResponse.json({ error: "Key required" }, { status: 400 });
  }

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return NextResponse.json(config);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "system.config")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Key required" }, { status: 400 });
  }

  await prisma.systemConfig.delete({ where: { key } });
  return NextResponse.json({ success: true });
}
