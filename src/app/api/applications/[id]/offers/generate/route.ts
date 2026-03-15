import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

// AI-assisted offer generation based on application data.
// Currently uses a rules-based heuristic engine. Can be replaced with
// a Claude API call for more sophisticated analysis in the future.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "offers.generate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const application = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      incomes: true,
      expenses: true,
      collateral: true,
      borrowers: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only generate offers for applications in review or conditionally approved
  const allowedStatuses = ["in_review", "conditionally_approved", "approved"];
  if (!allowedStatuses.includes(application.status)) {
    return NextResponse.json(
      { error: "Application must be in review or approved to generate offers" },
      { status: 400 }
    );
  }

  // Calculate financial metrics
  const totalMonthlyIncome = application.incomes.reduce(
    (sum, i) => sum + Number(i.monthlyAmount),
    0
  );
  const totalMonthlyExpenses = application.expenses.reduce(
    (sum, e) => sum + Number(e.monthlyAmount),
    0
  );
  const totalCollateralValue = application.collateral.reduce(
    (sum, c) => sum + Number(c.estimatedValue),
    0
  );

  const requestedAmount = Number(application.requestedAmount);
  const dti = totalMonthlyIncome > 0
    ? totalMonthlyExpenses / totalMonthlyIncome
    : 1;

  // Determine base rate based on risk factors
  let baseRate = 0.065; // 6.5% base
  if (dti > 0.43) baseRate += 0.015; // high DTI penalty
  if (dti > 0.5) baseRate += 0.02;
  if (application.loanType === "secured" && totalCollateralValue > 0) {
    const ltv = requestedAmount / totalCollateralValue;
    if (ltv <= 0.6) baseRate -= 0.01; // low LTV discount
    else if (ltv > 0.8) baseRate += 0.01; // high LTV penalty
  }
  if (application.loanType === "unsecured") {
    baseRate += 0.02; // unsecured premium
  }
  if (requestedAmount > 250000) baseRate += 0.005; // large loan adjustment

  // Clamp rate
  baseRate = Math.max(0.035, Math.min(0.15, baseRate));

  // Calculate recommended term and amount
  let offeredAmount = requestedAmount;
  let termMonths = application.termMonths;

  // If DTI is too high, suggest lower amount
  const monthlyRate = baseRate / 12;
  let projectedPayment =
    monthlyRate > 0
      ? (offeredAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
      : offeredAmount / termMonths;

  const maxPayment = totalMonthlyIncome * 0.36 - totalMonthlyExpenses;
  if (maxPayment > 0 && projectedPayment > maxPayment) {
    // Reduce amount to fit within affordability
    offeredAmount =
      monthlyRate > 0
        ? (maxPayment * (Math.pow(1 + monthlyRate, termMonths) - 1)) /
          (monthlyRate * Math.pow(1 + monthlyRate, termMonths))
        : maxPayment * termMonths;
    offeredAmount = Math.round(offeredAmount / 1000) * 1000; // round to nearest 1000
    projectedPayment =
      monthlyRate > 0
        ? (offeredAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
          (Math.pow(1 + monthlyRate, termMonths) - 1)
        : offeredAmount / termMonths;
  }

  // Build conditions
  const conditions: string[] = [];
  if (dti > 0.43) conditions.push("Debt-to-income ratio exceeds 43%; additional documentation required.");
  if (application.loanType === "secured" && totalCollateralValue < requestedAmount) {
    conditions.push("Collateral value below requested amount; additional collateral may be required.");
  }
  if (application.incomes.some((i) => !i.isVerified)) {
    conditions.push("Income verification pending.");
  }
  if (application.borrowers.length === 0) {
    conditions.push("Borrower information required.");
  }

  // Create offer as draft (requires human review)
  const offer = await prisma.offer.create({
    data: {
      applicationId: id,
      offeredAmount: Math.max(offeredAmount, 0),
      interestRate: Math.round(baseRate * 10000) / 10000,
      termMonths,
      monthlyPayment: Math.round(projectedPayment * 100) / 100,
      conditions: conditions.length > 0 ? conditions.join("\n") : null,
      isAiGenerated: true,
      createdById: session.user.id,
      status: "pending_review", // AI offers go straight to review
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
