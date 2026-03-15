import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { ReviewOfferSchema } from "@/lib/schemas/loan-application";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "offers.review")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { offerId } = await params;
  const body = await req.json();
  const parsed = ReviewOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "pending_review") {
    return NextResponse.json(
      { error: "Offer must be in pending_review status to review" },
      { status: 400 }
    );
  }

  const { action, reviewNotes } = parsed.data;
  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNotes,
    },
  });

  return NextResponse.json(offer);
}
