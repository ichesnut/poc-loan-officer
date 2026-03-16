import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";
import type { LoanPurpose, IncomeType } from "@/generated/prisma/client";

// Shared secret between applicant portal and loan officer app.
// Both apps must set SYNC_API_KEY in their environment.
function validateSyncAuth(req: Request): boolean {
  const apiKey = req.headers.get("x-sync-api-key");
  const expectedKey = process.env.SYNC_API_KEY;
  if (!expectedKey || !apiKey) return false;
  return apiKey === expectedKey;
}

// Map applicant portal purpose strings to loan officer LoanPurpose enum
const PURPOSE_MAP: Record<string, LoanPurpose> = {
  "Home improvement": "home_equity",
  "Debt consolidation": "personal",
  "Business": "business",
  "Education": "personal",
  "Vehicle": "auto",
  "Medical": "personal",
  "Other": "other",
};

// Map applicant employment status to loan officer IncomeType
const EMPLOYMENT_TO_INCOME_TYPE: Record<string, IncomeType> = {
  "Employed": "employment",
  "Self-employed": "self_employment",
  "Retired": "retirement",
  "Unemployed": "other",
  "Student": "other",
};

const SyncPayloadSchema = z.object({
  referenceId: z.string(),
  loanAmount: z.number().positive(),
  loanTerm: z.number().int().positive(),
  loanPurpose: z.string(),
  purposeOther: z.string().nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  dateOfBirth: z.string(),
  street: z.string(),
  apartment: z.string().nullable().optional(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  employmentStatus: z.string(),
  employerName: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  annualIncome: z.number(),
  yearsAtJob: z.number().nullable().optional(),
});

export async function POST(req: Request) {
  if (!validateSyncAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SyncPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    // Check for duplicate sync by referenceId
    const existing = await prisma.loanApplication.findFirst({
      where: { notes: { contains: data.referenceId } },
    });
    if (existing) {
      return NextResponse.json(
        { message: "Application already synced", applicationId: existing.id },
        { status: 200 }
      );
    }

    // Find a default officer to assign the application to.
    // Prefer a loan_officer role, fall back to admin.
    const officer = await prisma.user.findFirst({
      where: { role: "loan_officer", isActive: true },
    }) ?? await prisma.user.findFirst({
      where: { role: "admin", isActive: true },
    });

    if (!officer) {
      return NextResponse.json(
        { error: "No available loan officer to assign application" },
        { status: 500 }
      );
    }

    const purpose: LoanPurpose = PURPOSE_MAP[data.loanPurpose] ?? "other";
    const incomeType: IncomeType = EMPLOYMENT_TO_INCOME_TYPE[data.employmentStatus] ?? "other";

    // Build address string from components
    const addressParts = [data.street, data.apartment].filter(Boolean);
    const address = addressParts.join(", ");

    // Create LoanApplication + Borrower + Income in a single transaction
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.loanApplication.create({
        data: {
          status: "submitted",
          loanType: "unsecured",
          purpose,
          requestedAmount: data.loanAmount,
          termMonths: data.loanTerm,
          notes: `Synced from applicant portal. Reference: ${data.referenceId}${data.purposeOther ? `. Purpose detail: ${data.purposeOther}` : ""}`,
          officerId: officer.id,
        },
      });

      await tx.borrower.create({
        data: {
          applicationId: app.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: new Date(data.dateOfBirth),
          address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          isPrimary: true,
        },
      });

      if (data.annualIncome > 0) {
        await tx.income.create({
          data: {
            applicationId: app.id,
            type: incomeType,
            source: data.employerName || data.employmentStatus,
            monthlyAmount: data.annualIncome / 12,
          },
        });
      }

      return app;
    });

    return NextResponse.json(
      { message: "Application synced successfully", applicationId: application.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sync endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to sync application" },
      { status: 500 }
    );
  }
}
