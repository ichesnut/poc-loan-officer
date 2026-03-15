import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "offers.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { offerId } = await params;
  const existing = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Can only submit draft offers" }, { status: 400 });
  }

  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: { status: "pending_review" },
  });

  return NextResponse.json(offer);
}
