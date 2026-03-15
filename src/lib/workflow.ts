import type { LoanStatus, Role } from "@/generated/prisma/client";

// Valid status transitions: from → allowed destinations
const STATUS_TRANSITIONS: Record<string, LoanStatus[]> = {
  draft: ["submitted", "withdrawn"],
  submitted: ["in_review", "withdrawn"],
  in_review: ["approved", "conditionally_approved", "declined", "withdrawn"],
  approved: ["closing", "withdrawn"],
  conditionally_approved: ["in_review", "approved", "declined", "withdrawn"],
  declined: ["in_review"], // can be re-opened for appeal
  closing: ["closed", "withdrawn"],
  closed: [],
  withdrawn: [],
};

// Which roles can perform which transitions
const TRANSITION_PERMISSIONS: Record<string, Role[]> = {
  "draft→submitted": ["admin", "branch_manager", "loan_officer"],
  "submitted→in_review": ["admin", "branch_manager", "processor", "underwriter"],
  "submitted→withdrawn": ["admin", "branch_manager", "loan_officer"],
  "in_review→approved": ["admin", "branch_manager", "underwriter"],
  "in_review→conditionally_approved": ["admin", "branch_manager", "underwriter"],
  "in_review→declined": ["admin", "branch_manager", "underwriter"],
  "in_review→withdrawn": ["admin", "branch_manager", "loan_officer"],
  "approved→closing": ["admin", "branch_manager", "processor"],
  "approved→withdrawn": ["admin", "branch_manager", "loan_officer"],
  "conditionally_approved→in_review": ["admin", "branch_manager", "loan_officer", "processor"],
  "conditionally_approved→approved": ["admin", "branch_manager", "underwriter"],
  "conditionally_approved→declined": ["admin", "branch_manager", "underwriter"],
  "conditionally_approved→withdrawn": ["admin", "branch_manager", "loan_officer"],
  "declined→in_review": ["admin", "branch_manager"],
  "closing→closed": ["admin", "branch_manager", "processor"],
  "closing→withdrawn": ["admin", "branch_manager"],
  "draft→withdrawn": ["admin", "branch_manager", "loan_officer"],
};

export function getAvailableTransitions(currentStatus: LoanStatus): LoanStatus[] {
  return STATUS_TRANSITIONS[currentStatus] ?? [];
}

export function canTransition(
  currentStatus: LoanStatus,
  targetStatus: LoanStatus,
  role: Role
): boolean {
  const allowed = STATUS_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) return false;

  const key = `${currentStatus}→${targetStatus}`;
  const roles = TRANSITION_PERMISSIONS[key];
  if (!roles) return false;

  return roles.includes(role);
}

export function getPermittedTransitions(
  currentStatus: LoanStatus,
  role: Role
): LoanStatus[] {
  const available = getAvailableTransitions(currentStatus);
  return available.filter((target) => canTransition(currentStatus, target, role));
}

// Transition labels for UI buttons
export const TRANSITION_LABELS: Record<string, string> = {
  submitted: "Submit for Review",
  in_review: "Begin Review",
  approved: "Approve",
  conditionally_approved: "Conditionally Approve",
  declined: "Decline",
  closing: "Move to Closing",
  closed: "Close Loan",
  withdrawn: "Withdraw",
};

// Transition button variants
export const TRANSITION_VARIANTS: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  submitted: "default",
  in_review: "secondary",
  approved: "default",
  conditionally_approved: "secondary",
  declined: "destructive",
  closing: "default",
  closed: "default",
  withdrawn: "outline",
};
