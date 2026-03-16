import { z } from "zod/v4";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const LoanStatusSchema = z.enum([
  "draft",
  "submitted",
  "in_review",
  "approved",
  "conditionally_approved",
  "declined",
  "closing",
  "closed",
  "withdrawn",
]);

export const LoanTypeSchema = z.enum(["unsecured", "secured"]);

export const OfferStatusSchema = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "sent",
  "accepted",
  "expired",
]);

export const LoanPurposeSchema = z.enum([
  "purchase",
  "refinance",
  "home_equity",
  "construction",
  "personal",
  "auto",
  "business",
  "other",
]);

export const IncomeTypeSchema = z.enum([
  "employment",
  "self_employment",
  "rental",
  "investment",
  "retirement",
  "social_security",
  "alimony",
  "child_support",
  "other",
]);

export const ExpenseTypeSchema = z.enum([
  "housing",
  "auto_loan",
  "student_loan",
  "credit_card",
  "child_care",
  "insurance",
  "utilities",
  "other",
]);

export const AssetTypeSchema = z.enum([
  "real_estate",
  "vehicle",
  "savings",
  "investment",
  "business",
  "other",
]);

// ─── Loan Application ──────────────────────────────────────────────────────

export const CreateLoanApplicationSchema = z.object({
  purpose: LoanPurposeSchema,
  loanType: LoanTypeSchema.optional().default("unsecured"),
  requestedAmount: z.coerce.number().positive("Requested amount must be positive"),
  termMonths: z.coerce.number().int().min(1, "Term must be at least 1 month"),
  interestRate: z.coerce.number().min(0).max(1, "Rate must be between 0 and 1").optional(),
  notes: z.string().optional(),
});

export const UpdateLoanApplicationSchema = z.object({
  purpose: LoanPurposeSchema.optional(),
  loanType: LoanTypeSchema.optional(),
  requestedAmount: z.coerce.number().positive().optional(),
  termMonths: z.coerce.number().int().min(1).optional(),
  interestRate: z.coerce.number().min(0).max(1).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const TransitionStatusSchema = z.object({
  targetStatus: LoanStatusSchema,
  reason: z.string().optional(),
});

// ─── Offer ──────────────────────────────────────────────────────────────────

export const CreateOfferSchema = z.object({
  offeredAmount: z.coerce.number().positive("Offered amount must be positive"),
  interestRate: z.coerce.number().min(0).max(1, "Rate must be between 0 and 1"),
  termMonths: z.coerce.number().int().min(1, "Term must be at least 1 month"),
  conditions: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const UpdateOfferSchema = z.object({
  offeredAmount: z.coerce.number().positive().optional(),
  interestRate: z.coerce.number().min(0).max(1).optional(),
  termMonths: z.coerce.number().int().min(1).optional(),
  conditions: z.string().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const ReviewOfferSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNotes: z.string().optional(),
});

// ─── Borrower ───────────────────────────────────────────────────────────────

export const CreateBorrowerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  ssn: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const UpdateBorrowerSchema = CreateBorrowerSchema.partial();

// ─── Income ─────────────────────────────────────────────────────────────────

export const CreateIncomeSchema = z.object({
  type: IncomeTypeSchema,
  source: z.string().min(1, "Source is required"),
  monthlyAmount: z.coerce.number().min(0, "Amount must be non-negative"),
  isVerified: z.boolean().optional(),
  notes: z.string().optional(),
});

export const UpdateIncomeSchema = CreateIncomeSchema.partial();

// ─── Expense ────────────────────────────────────────────────────────────────

export const CreateExpenseSchema = z.object({
  type: ExpenseTypeSchema,
  description: z.string().min(1, "Description is required"),
  monthlyAmount: z.coerce.number().min(0, "Amount must be non-negative"),
  notes: z.string().optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

// ─── Collateral Asset ───────────────────────────────────────────────────────

export const CreateCollateralAssetSchema = z.object({
  type: AssetTypeSchema,
  description: z.string().min(1, "Description is required"),
  estimatedValue: z.coerce.number().positive("Value must be positive"),
  appraisedValue: z.coerce.number().positive().optional(),
  lienPosition: z.coerce.number().int().min(1).optional(),
  notes: z.string().optional(),
});

export const UpdateCollateralAssetSchema = CreateCollateralAssetSchema.partial();

// ─── Closing ────────────────────────────────────────────────────────────

export const UpdateClosingDetailSchema = z.object({
  closingDate: z.coerce.date().nullable().optional(),
  fundingAmount: z.coerce.number().min(0).nullable().optional(),
  closingAgentName: z.string().nullable().optional(),
  closingNotes: z.string().nullable().optional(),
});

export const UpdateChecklistItemSchema = z.object({
  id: z.string(),
  completed: z.boolean(),
});

// ─── Display helpers ────────────────────────────────────────────────────────

export const LOAN_PURPOSE_LABELS: Record<string, string> = {
  purchase: "Purchase",
  refinance: "Refinance",
  home_equity: "Home Equity",
  construction: "Construction",
  personal: "Personal",
  auto: "Auto",
  business: "Business",
  other: "Other",
};

export const LOAN_STATUS_LABELS: Record<string, string> = {
  draft: "New",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  conditionally_approved: "Cond. Approved",
  declined: "Declined",
  closing: "Closing",
  closed: "Closed",
  withdrawn: "Withdrawn",
};

export const LOAN_TYPE_LABELS: Record<string, string> = {
  unsecured: "Unsecured",
  secured: "Secured",
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
};

export const INCOME_TYPE_LABELS: Record<string, string> = {
  employment: "Employment",
  self_employment: "Self Employment",
  rental: "Rental",
  investment: "Investment",
  retirement: "Retirement",
  social_security: "Social Security",
  alimony: "Alimony",
  child_support: "Child Support",
  other: "Other",
};

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  housing: "Housing",
  auto_loan: "Auto Loan",
  student_loan: "Student Loan",
  credit_card: "Credit Card",
  child_care: "Child Care",
  insurance: "Insurance",
  utilities: "Utilities",
  other: "Other",
};

export const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: "Real Estate",
  vehicle: "Vehicle",
  savings: "Savings",
  investment: "Investment",
  business: "Business",
  other: "Other",
};
