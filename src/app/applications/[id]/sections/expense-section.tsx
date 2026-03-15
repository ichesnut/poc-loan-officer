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
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  EXPENSE_TYPE_LABELS,
  ExpenseTypeSchema,
} from "@/lib/schemas/loan-application";
import type { Expense } from "../application-detail";

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function ExpenseSection({
  applicationId,
  expenses,
  canEdit,
}: {
  applicationId: string;
  expenses: Expense[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: Expense) {
    setEditing(item);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      type: form.get("type") as string,
      description: form.get("description") as string,
      monthlyAmount: Number(form.get("monthlyAmount")),
      notes: (form.get("notes") as string) || undefined,
    };

    const url = editing
      ? `/api/applications/${applicationId}/expenses/${editing.id}`
      : `/api/applications/${applicationId}/expenses`;
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
    await fetch(`/api/applications/${applicationId}/expenses/${id}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  const totalMonthly = expenses.reduce((sum, e) => sum + Number(e.monthlyAmount), 0);
  const types = ExpenseTypeSchema.options;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total Monthly Expenses: <span className="font-semibold text-foreground">{formatCurrency(totalMonthly)}</span>
        </p>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1 size-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Update expense details." : "Enter expense details."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Expense Type</Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={editing?.type ?? "housing"}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {EXPENSE_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={editing?.description}
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
                <Button type="submit">{editing ? "Save Changes" : "Add Expense"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {expenses.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No expense records added yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Monthly Amount</TableHead>
              {canEdit && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{EXPENSE_TYPE_LABELS[expense.type] ?? expense.type}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{formatCurrency(expense.monthlyAmount)}</TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(expense)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(expense.id)}
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
