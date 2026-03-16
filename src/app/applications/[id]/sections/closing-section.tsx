"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2, Save } from "lucide-react";

type ChecklistItem = {
  id: string;
  name: string;
  completed: boolean;
  completedAt: string | null;
};

type ClosingData = {
  id: string;
  closingDate: string | null;
  fundingAmount: string | number | null;
  closingAgentName: string | null;
  closingNotes: string | null;
  checklistItems: ChecklistItem[];
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function ClosingSection({
  applicationId,
  canEdit,
}: {
  applicationId: string;
  canEdit: boolean;
}) {
  const [data, setData] = useState<ClosingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [closingDate, setClosingDate] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  const [closingAgentName, setClosingAgentName] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/applications/${applicationId}/closing`);
    if (res.ok) {
      const closing: ClosingData = await res.json();
      setData(closing);
      setClosingDate(
        closing.closingDate
          ? new Date(closing.closingDate).toISOString().split("T")[0]
          : ""
      );
      setFundingAmount(
        closing.fundingAmount != null ? String(Number(closing.fundingAmount)) : ""
      );
      setClosingAgentName(closing.closingAgentName ?? "");
      setClosingNotes(closing.closingNotes ?? "");
    }
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleItem(item: ChecklistItem) {
    if (!canEdit) return;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklistItems: prev.checklistItems.map((ci) =>
          ci.id === item.id
            ? { ...ci, completed: !ci.completed, completedAt: !ci.completed ? new Date().toISOString() : null }
            : ci
        ),
      };
    });

    await fetch(`/api/applications/${applicationId}/closing`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checklistUpdates: [{ id: item.id, completed: !item.completed }],
      }),
    });
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/applications/${applicationId}/closing`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        detail: {
          closingDate: closingDate || null,
          fundingAmount: fundingAmount ? Number(fundingAmount) : null,
          closingAgentName: closingAgentName || null,
          closingNotes: closingNotes || null,
        },
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setData(updated);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Unable to load closing data.
      </p>
    );
  }

  const completedCount = data.checklistItems.filter((i) => i.completed).length;
  const totalCount = data.checklistItems.length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Closing Checklist</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{totalCount} completed
            </span>
          </CardTitle>
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.checklistItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleToggleItem(item)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors disabled:opacity-60 disabled:cursor-default text-left"
                >
                  {item.completed ? (
                    <CheckCircle2 className="size-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                    {item.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Closing Details Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Closing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveDetails} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="closingDate">Closing Date</Label>
              <Input
                id="closingDate"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fundingAmount">Funding Amount ($)</Label>
              <Input
                id="fundingAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                disabled={!canEdit}
              />
              {fundingAmount && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(fundingAmount)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="closingAgentName">Closing Agent Name</Label>
              <Input
                id="closingAgentName"
                placeholder="Enter closing agent name"
                value={closingAgentName}
                onChange={(e) => setClosingAgentName(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="closingNotes">Closing Notes</Label>
              <textarea
                id="closingNotes"
                rows={4}
                placeholder="Enter any closing notes..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                disabled={!canEdit}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {canEdit && (
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Save className="mr-1 size-4" />
                )}
                Save Details
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
