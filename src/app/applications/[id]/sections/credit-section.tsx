"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  LIABILITY_TYPE_LABELS,
  LiabilityTypeSchema,
} from "@/lib/schemas/loan-application";

type Liability = {
  id: string;
  type: string;
  creditor: string;
  accountNumber: string | null;
  monthlyPayment: string | number;
  outstandingBalance: string | number;
  notes: string | null;
};

type CreditSummaryData = {
  id: string;
  creditScore: number | null;
  creditScoreDate: string | null;
  totalMonthlyDebt: string | number | null;
  debtToIncomeRatio: string | number | null;
  notes: string | null;
} | null;

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function CreditSection({
  applicationId,
  canEdit,
}: {
  applicationId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [creditSummary, setCreditSummary] = useState<CreditSummaryData>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Liability | null>(null);
  const [summaryEditing, setSummaryEditing] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/applications/${applicationId}/credit`);
    if (res.ok) {
      const data = await res.json();
      setLiabilities(data.liabilities);
      setCreditSummary(data.creditSummary);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: Liability) {
    setEditing(item);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (editing) {
      const body = {
        type: form.get("type") as string,
        creditor: form.get("creditor") as string,
        accountNumber: (form.get("accountNumber") as string) || undefined,
        monthlyPayment: Number(form.get("monthlyPayment")),
        outstandingBalance: Number(form.get("outstandingBalance")),
        notes: (form.get("notes") as string) || undefined,
      };
      const res = await fetch(
        `/api/applications/${applicationId}/credit/${editing.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const body = {
        action: "addLiability" as const,
        data: {
          type: form.get("type") as string,
          creditor: form.get("creditor") as string,
          accountNumber: (form.get("accountNumber") as string) || undefined,
          monthlyPayment: Number(form.get("monthlyPayment")),
          outstandingBalance: Number(form.get("outstandingBalance")),
          notes: (form.get("notes") as string) || undefined,
        },
      };
      const res = await fetch(`/api/applications/${applicationId}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/applications/${applicationId}/credit/${id}`, {
      method: "DELETE",
    });
    fetchData();
  }

  async function handleSummarySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const scoreRaw = form.get("creditScore") as string;
    const dateRaw = form.get("creditScoreDate") as string;
    const notesRaw = form.get("notes") as string;

    const body = {
      action: "updateSummary" as const,
      data: {
        creditScore: scoreRaw ? Number(scoreRaw) : null,
        creditScoreDate: dateRaw || null,
        notes: notesRaw || null,
      },
    };

    const res = await fetch(`/api/applications/${applicationId}/credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setSummaryEditing(false);
      fetchData();
    }
  }

  const totalMonthlyDebt = liabilities.reduce(
    (sum, l) => sum + Number(l.monthlyPayment),
    0
  );
  const totalOutstanding = liabilities.reduce(
    (sum, l) => sum + Number(l.outstandingBalance),
    0
  );
  const types = LiabilityTypeSchema.options;

  const dtiDisplay = creditSummary?.debtToIncomeRatio
    ? `${(Number(creditSummary.debtToIncomeRatio) * 100).toFixed(1)}%`
    : "N/A";

  return (
    <div className="space-y-6">
      {/* Credit Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Credit Summary</CardTitle>
          {canEdit && !summaryEditing && (
            <Button variant="outline" size="sm" onClick={() => setSummaryEditing(true)}>
              <Pencil className="mr-1 size-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {summaryEditing ? (
            <form onSubmit={handleSummarySubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="creditScore">Credit Score</Label>
                <Input
                  id="creditScore"
                  name="creditScore"
                  type="number"
                  min="300"
                  max="850"
                  defaultValue={creditSummary?.creditScore ?? ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="creditScoreDate">Score Date</Label>
                <Input
                  id="creditScoreDate"
                  name="creditScoreDate"
                  type="date"
                  defaultValue={
                    creditSummary?.creditScoreDate
                      ? new Date(creditSummary.creditScoreDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  defaultValue={creditSummary?.notes ?? ""}
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" size="sm">Save</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSummaryEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Credit Score</p>
                <p className="text-lg font-semibold">
                  {creditSummary?.creditScore ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score Date</p>
                <p className="text-lg font-semibold">
                  {creditSummary?.creditScoreDate
                    ? new Date(creditSummary.creditScoreDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Monthly Debt</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totalMonthlyDebt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DTI Ratio</p>
                <p className="text-lg font-semibold">{dtiDisplay}</p>
              </div>
              {creditSummary?.notes && (
                <div className="sm:col-span-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{creditSummary.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liabilities Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Total Monthly Payments:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(totalMonthlyDebt)}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Total Outstanding:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(totalOutstanding)}
              </span>
            </p>
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button size="sm" onClick={openCreate} />}>
                <Plus className="mr-1 size-4" />
                Add Liability
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Edit Liability" : "Add Liability"}
                  </DialogTitle>
                  <DialogDescription>
                    {editing
                      ? "Update liability details."
                      : "Enter liability details."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type">Liability Type</Label>
                    <select
                      id="type"
                      name="type"
                      defaultValue={editing?.type ?? "credit_card"}
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {types.map((t) => (
                        <option key={t} value={t}>
                          {LIABILITY_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="creditor">Creditor</Label>
                    <Input
                      id="creditor"
                      name="creditor"
                      defaultValue={editing?.creditor}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      defaultValue={editing?.accountNumber ?? ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="monthlyPayment">Monthly Payment ($)</Label>
                      <Input
                        id="monthlyPayment"
                        name="monthlyPayment"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={
                          editing ? Number(editing.monthlyPayment) : undefined
                        }
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="outstandingBalance">
                        Outstanding Balance ($)
                      </Label>
                      <Input
                        id="outstandingBalance"
                        name="outstandingBalance"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={
                          editing ? Number(editing.outstandingBalance) : undefined
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      name="notes"
                      defaultValue={editing?.notes ?? ""}
                    />
                  </div>
                  <Button type="submit">
                    {editing ? "Save Changes" : "Add Liability"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {liabilities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No liabilities added yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Creditor</TableHead>
                <TableHead>Account #</TableHead>
                <TableHead>Monthly Payment</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                {canEdit && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {liabilities.map((liability) => (
                <TableRow key={liability.id}>
                  <TableCell>
                    {LIABILITY_TYPE_LABELS[liability.type] ?? liability.type}
                  </TableCell>
                  <TableCell>{liability.creditor}</TableCell>
                  <TableCell>
                    {liability.accountNumber ? (
                      <span className="inline-flex items-center gap-1">
                        {liability.accountNumber}
                        <CopyButton value={liability.accountNumber} />
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(liability.monthlyPayment)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(liability.outstandingBalance)}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(liability)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(liability.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
