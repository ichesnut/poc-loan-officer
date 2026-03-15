import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { CreateOfferSchema } from "@/lib/schemas/loan-application";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.list")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const offers = await prisma.offer.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(offers);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "offers.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = CreateOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Calculate monthly payment (simple amortization formula)
  const monthlyRate = parsed.data.interestRate / 12;
  const n = parsed.data.termMonths;
  const principal = parsed.data.offeredAmount;
  const monthlyPayment =
    monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1)
      : principal / n;

  const offer = await prisma.offer.create({
    data: {
      applicationId: id,
      offeredAmount: parsed.data.offeredAmount,
      interestRate: parsed.data.interestRate,
      termMonths: parsed.data.termMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      conditions: parsed.data.conditions,
      expiresAt: parsed.data.expiresAt,
      createdById: session.user.id,
      status: "draft",
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
