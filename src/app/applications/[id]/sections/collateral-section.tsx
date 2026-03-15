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
  ASSET_TYPE_LABELS,
  AssetTypeSchema,
} from "@/lib/schemas/loan-application";
import type { CollateralAsset } from "../application-detail";

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function CollateralSection({
  applicationId,
  assets,
  canEdit,
}: {
  applicationId: string;
  assets: CollateralAsset[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CollateralAsset | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: CollateralAsset) {
    setEditing(item);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      type: form.get("type") as string,
      description: form.get("description") as string,
      estimatedValue: Number(form.get("estimatedValue")),
      notes: (form.get("notes") as string) || undefined,
    };

    const url = editing
      ? `/api/applications/${applicationId}/collateral/${editing.id}`
      : `/api/applications/${applicationId}/collateral`;
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
    await fetch(`/api/applications/${applicationId}/collateral/${id}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  const totalValue = assets.reduce((sum, a) => sum + Number(a.estimatedValue), 0);
  const types = AssetTypeSchema.options;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total Collateral Value: <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
        </p>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1 size-4" />
                Add Collateral
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Collateral Asset" : "Add Collateral Asset"}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Update collateral asset details."
                    : "Enter collateral asset details."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Asset Type</Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={editing?.type ?? "real_estate"}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {ASSET_TYPE_LABELS[t]}
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
                  <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                  <Input
                    id="estimatedValue"
                    name="estimatedValue"
                    type="number"
                    min="1"
                    step="0.01"
                    defaultValue={editing ? Number(editing.estimatedValue) : undefined}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" defaultValue={editing?.notes ?? ""} />
                </div>
                <Button type="submit">
                  {editing ? "Save Changes" : "Add Collateral"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {assets.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No collateral assets added yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Estimated Value</TableHead>
              {canEdit && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{ASSET_TYPE_LABELS[asset.type] ?? asset.type}</TableCell>
                <TableCell>{asset.description}</TableCell>
                <TableCell>{formatCurrency(asset.estimatedValue)}</TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(asset)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(asset.id)}
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
