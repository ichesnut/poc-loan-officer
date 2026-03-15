import type { Role } from "@/generated/prisma/client";

// Permission matrix: which roles can perform which actions.
// Actions follow "resource.verb" convention.
const PERMISSION_MATRIX: Record<string, Role[]> = {
  // User management
  "users.list": ["admin", "branch_manager"],
  "users.create": ["admin"],
  "users.update": ["admin"],
  "users.delete": ["admin"],
  "users.view": ["admin", "branch_manager"],

  // Group management
  "groups.list": ["admin", "branch_manager"],
  "groups.create": ["admin"],
  "groups.update": ["admin"],
  "groups.delete": ["admin"],

  // Loan operations
  "loans.list": ["admin", "branch_manager", "loan_officer", "processor", "underwriter"],
  "loans.create": ["admin", "branch_manager", "loan_officer"],
  "loans.update": ["admin", "branch_manager", "loan_officer", "processor"],
  "loans.approve": ["admin", "branch_manager", "underwriter"],
  "loans.transition": ["admin", "branch_manager", "loan_officer", "processor", "underwriter"],
  "loans.delete": ["admin"],

  // Offer operations
  "offers.create": ["admin", "branch_manager", "loan_officer"],
  "offers.update": ["admin", "branch_manager", "loan_officer"],
  "offers.review": ["admin", "branch_manager", "underwriter"],
  "offers.generate": ["admin", "branch_manager", "loan_officer"],

  // System configuration
  "system.config": ["admin"],
  "system.dashboard": ["admin", "branch_manager"],

  // Reports
  "reports.view": ["admin", "branch_manager"],
};

export function hasPermission(role: Role, action: string): boolean {
  const allowedRoles = PERMISSION_MATRIX[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export function getPermissionsForRole(role: Role): string[] {
  return Object.entries(PERMISSION_MATRIX)
    .filter(([, roles]) => roles.includes(role))
    .map(([action]) => action);
}

export function getAllPermissions(): string[] {
  return Object.keys(PERMISSION_MATRIX);
}

export function getRolesForPermission(action: string): Role[] {
  return PERMISSION_MATRIX[action] ?? [];
}

export const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "branch_manager", label: "Branch Manager" },
  { value: "loan_officer", label: "Loan Officer" },
  { value: "processor", label: "Processor" },
  { value: "underwriter", label: "Underwriter" },
];
