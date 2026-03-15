import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { UpdateOfferSchema } from "@/lib/schemas/loan-application";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "offers.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { offerId } = await params;
  const body = await req.json();
  const parsed = UpdateOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Can only edit draft offers" }, { status: 400 });
  }

  // Recalculate monthly payment if terms changed
  const amount = parsed.data.offeredAmount ?? Number(existing.offeredAmount);
  const rate = parsed.data.interestRate ?? Number(existing.interestRate);
  const term = parsed.data.termMonths ?? existing.termMonths;
  const monthlyRate = rate / 12;
  const monthlyPayment =
    monthlyRate > 0
      ? (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
        (Math.pow(1 + monthlyRate, term) - 1)
      : amount / term;

  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      ...parsed.data,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    },
  });

  return NextResponse.json(offer);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "offers.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { offerId } = await params;
  const existing = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Can only delete draft offers" }, { status: 400 });
  }

  await prisma.offer.delete({ where: { id: offerId } });
  return NextResponse.json({ success: true });
}
