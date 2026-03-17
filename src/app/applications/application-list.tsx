"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Eye, Search, Filter, ArrowUpDown, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  LOAN_PURPOSE_LABELS,
  LOAN_STATUS_LABELS,
  LOAN_TYPE_LABELS,
  LoanPurposeSchema,
  LoanStatusSchema,
  LoanTypeSchema,
} from "@/lib/schemas/loan-application";

type ApplicationRow = {
  id: string;
  loanNumber: string;
  referenceId: string | null;
  status: string;
  loanType: string;
  purpose: string;
  requestedAmount: string | number;
  termMonths: number;
  createdAt: string;
  officer: { id: string; name: string | null; email: string };
  borrowers: { firstName: string; lastName: string }[];
  _count: { borrowers: number; incomes: number; expenses: number; collateral: number };
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  in_review: "secondary",
  approved: "default",
  conditionally_approved: "secondary",
  declined: "destructive",
  closing: "default",
  closed: "outline",
  withdrawn: "outline",
};

type SortOption = "newest" | "oldest" | "amount_high" | "amount_low";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  amount_high: "Amount (High to Low)",
  amount_low: "Amount (Low to High)",
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function ApplicationList({
  applications,
  canCreate,
}: {
  applications: ApplicationRow[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  // Read filter state from URL query params
  const query = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const purposeFilter = searchParams.get("purpose")?.split(",").filter(Boolean) ?? [];
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
  const sort = (searchParams.get("sort") as SortOption) ?? "newest";

  const hasActiveFilters = statusFilter.length > 0 || purposeFilter.length > 0 || dateFrom || dateTo;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  function toggleArrayParam(key: string, value: string, current: string[]) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParams({ [key]: next.length > 0 ? next.join(",") : null });
  }

  // Filter and sort applications
  const filtered = useMemo(() => {
    let result = applications;

    // Text search across borrower name and loan number
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((app) => {
        const borrowerName = app.borrowers[0]
          ? `${app.borrowers[0].firstName} ${app.borrowers[0].lastName}`.toLowerCase()
          : "";
        return (
          borrowerName.includes(q) ||
          app.loanNumber.toLowerCase().includes(q) ||
          (app.referenceId?.toLowerCase().includes(q) ?? false)
        );
      });
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((app) => statusFilter.includes(app.status));
    }

    // Purpose filter (labeled as "Loan Type" per task spec since it includes personal, auto, etc.)
    if (purposeFilter.length > 0) {
      result = result.filter((app) => purposeFilter.includes(app.purpose));
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((app) => new Date(app.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((app) => new Date(app.createdAt) <= to);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount_high":
          return Number(b.requestedAmount) - Number(a.requestedAmount);
        case "amount_low":
          return Number(a.requestedAmount) - Number(b.requestedAmount);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [applications, query, statusFilter, purposeFilter, dateFrom, dateTo, sort]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      purpose: form.get("purpose") as string,
      loanType: form.get("loanType") as string,
      requestedAmount: Number(form.get("requestedAmount")),
      termMonths: Number(form.get("termMonths")),
    };

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      let message = "Failed to create application";
      try {
        const data = JSON.parse(text);
        message = data.error || message;
      } catch {
        // Server returned non-JSON error response
      }
      setError(message);
      return;
    }

    const app = await res.json();
    setDialogOpen(false);
    router.push(`/applications/${app.id}`);
  }

  const purposes = LoanPurposeSchema.options;
  const statuses = LoanStatusSchema.options;
  const loanTypes = LoanTypeSchema.options;

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by borrower name or loan #..."
              defaultValue={query}
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                updateParams({ q: target.value || null });
              }}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Filter className="mr-1 size-4" />
                Status
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {statusFilter.length}
                  </Badge>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statuses.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter.includes(s)}
                  onCheckedChange={() => toggleArrayParam("status", s, statusFilter)}
                >
                  {LOAN_STATUS_LABELS[s] ?? s}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Purpose Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Filter className="mr-1 size-4" />
                Loan Type
                {purposeFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {purposeFilter.length}
                  </Badge>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Loan Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {purposes.map((p) => (
                <DropdownMenuCheckboxItem
                  key={p}
                  checked={purposeFilter.includes(p)}
                  onCheckedChange={() => toggleArrayParam("purpose", p, purposeFilter)}
                >
                  {LOAN_PURPOSE_LABELS[p] ?? p}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Range */}
          <div className="flex items-center gap-1">
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                updateParams({ from: target.value || null });
              }}
              className="w-[140px] text-sm"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                updateParams({ to: target.value || null });
              }}
              className="w-[140px] text-sm"
            />
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                <ArrowUpDown className="mr-1 size-4" />
                {SORT_LABELS[sort]}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={sort === s}
                  onCheckedChange={() => updateParams({ sort: s === "newest" ? null : s })}
                >
                  {SORT_LABELS[s]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {(query || hasActiveFilters || sort !== "newest") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateParams({ q: null, status: null, purpose: null, from: null, to: null, sort: null })}
            >
              <X className="mr-1 size-4" />
              Clear
            </Button>
          )}

          {/* New Application Button */}
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger className={buttonVariants({ size: "sm" })}>
                  <Plus className="mr-1 size-4" />
                  New Application
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Loan Application</DialogTitle>
                  <DialogDescription>
                    Create a new loan application. You can add borrower details after.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="purpose">Loan Purpose</Label>
                    <select
                      id="purpose"
                      name="purpose"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {purposes.map((p) => (
                        <option key={p} value={p}>
                          {LOAN_PURPOSE_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="loanType">Loan Type</Label>
                    <select
                      id="loanType"
                      name="loanType"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {loanTypes.map((t) => (
                        <option key={t} value={t}>
                          {LOAN_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="requestedAmount">Requested Amount ($)</Label>
                    <Input
                      id="requestedAmount"
                      name="requestedAmount"
                      type="number"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="termMonths">Term (months)</Label>
                    <Input
                      id="termMonths"
                      name="termMonths"
                      type="number"
                      min="1"
                      defaultValue="360"
                      required
                    />
                  </div>
                  <Button type="submit">Create Application</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {filtered.length === applications.length
            ? `${applications.length} application${applications.length !== 1 ? "s" : ""}`
            : `${filtered.length} of ${applications.length} application${applications.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Loan #</TableHead>
            <TableHead>Borrower</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Officer</TableHead>
            <TableHead className="w-16">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                {applications.length === 0
                  ? "No applications found. Create one to get started."
                  : "No applications match your filters."}
              </TableCell>
            </TableRow>
          )}
          {filtered.map((app) => {
            const primaryBorrower = app.borrowers[0];
            return (
              <TableRow key={app.id}>
                <TableCell className="font-mono text-xs" title={app.id}>
                  {app.referenceId ?? app.loanNumber.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {primaryBorrower
                    ? `${primaryBorrower.firstName} ${primaryBorrower.lastName}`
                    : "\u2014"}
                </TableCell>
                <TableCell>{LOAN_TYPE_LABELS[app.loanType] ?? app.loanType}</TableCell>
                <TableCell>{LOAN_PURPOSE_LABELS[app.purpose] ?? app.purpose}</TableCell>
                <TableCell>{formatCurrency(app.requestedAmount)}</TableCell>
                <TableCell>{app.termMonths}mo</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[app.status] ?? "outline"}>
                    {LOAN_STATUS_LABELS[app.status] ?? app.status}
                  </Badge>
                </TableCell>
                <TableCell>{app.officer.name ?? app.officer.email}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => router.push(`/applications/${app.id}`)}
                  >
                    <Eye className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
