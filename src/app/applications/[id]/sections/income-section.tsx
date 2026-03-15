"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  INCOME_TYPE_LABELS,
  IncomeTypeSchema,
} from "@/lib/schemas/loan-application";
import type { Income } from "../application-detail";

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function IncomeSection({
  applicationId,
  incomes,
  canEdit,
}: {
  applicationId: string;
  incomes: Income[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: Income) {
    setEditing(item);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      type: form.get("type") as string,
      source: form.get("source") as string,
      monthlyAmount: Number(form.get("monthlyAmount")),
      notes: (form.get("notes") as string) || undefined,
    };

    const url = editing
      ? `/api/applications/${applicationId}/income/${editing.id}`
      : `/api/applications/${applicationId}/income`;
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setDialogOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/applications/${applicationId}/income/${id}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  const totalMonthly = incomes.reduce((sum, i) => sum + Number(i.monthlyAmount), 0);
  const types = IncomeTypeSchema.options;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total Monthly Income: <span className="font-semibold text-foreground">{formatCurrency(totalMonthly)}</span>
        </p>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1 size-4" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Income" : "Add Income"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Update income details." : "Enter income source details."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Income Type</Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={editing?.type ?? "employment"}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {INCOME_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="source">Source / Employer</Label>
                  <Input
                    id="source"
                    name="source"
                    defaultValue={editing?.source}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="monthlyAmount">Monthly Amount ($)</Label>
                  <Input
                    id="monthlyAmount"
                    name="monthlyAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editing ? Number(editing.monthlyAmount) : undefined}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" defaultValue={editing?.notes ?? ""} />
                </div>
                <Button type="submit">{editing ? "Save Changes" : "Add Income"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {incomes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No income records added yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Monthly Amount</TableHead>
              <TableHead>Verified</TableHead>
              {canEdit && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomes.map((income) => (
              <TableRow key={income.id}>
                <TableCell>{INCOME_TYPE_LABELS[income.type] ?? income.type}</TableCell>
                <TableCell>{income.source}</TableCell>
                <TableCell>{formatCurrency(income.monthlyAmount)}</TableCell>
                <TableCell>
                  <Badge variant={income.isVerified ? "default" : "outline"}>
                    {income.isVerified ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(income)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(income.id)}
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
  );
}
