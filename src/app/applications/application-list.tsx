"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Eye } from "lucide-react";
import {
  LOAN_PURPOSE_LABELS,
  LOAN_STATUS_LABELS,
  LOAN_TYPE_LABELS,
  LoanPurposeSchema,
  LoanTypeSchema,
} from "@/lib/schemas/loan-application";

type ApplicationRow = {
  id: string;
  loanNumber: string;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

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
  const loanTypes = LoanTypeSchema.options;

  return (
    <>
      {canCreate && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button size="sm">
                <Plus className="mr-1 size-4" />
                New Application
              </Button>
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
        </div>
      )}

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
          {applications.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                No applications found. Create one to get started.
              </TableCell>
            </TableRow>
          )}
          {applications.map((app) => {
            const primaryBorrower = app.borrowers[0];
            return (
              <TableRow key={app.id}>
                <TableCell className="font-mono text-xs">
                  {app.loanNumber.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {primaryBorrower
                    ? `${primaryBorrower.firstName} ${primaryBorrower.lastName}`
                    : "—"}
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
