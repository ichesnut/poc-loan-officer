"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Plus, Sparkles, CheckCircle, XCircle, Trash2, Send } from "lucide-react";
import { OFFER_STATUS_LABELS } from "@/lib/schemas/loan-application";
import type { Offer } from "../application-detail";

const OFFER_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  pending_review: "secondary",
  approved: "default",
  rejected: "destructive",
  sent: "default",
  accepted: "default",
  expired: "outline",
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function OfferSection({
  applicationId,
  offers,
  canCreate,
  canReview,
  canGenerate,
  applicationStatus,
}: {
  applicationId: string;
  offers: Offer[];
  canCreate: boolean;
  canReview: boolean;
  canGenerate: boolean;
  applicationStatus: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const canGenerateForStatus = ["in_review", "conditionally_approved", "approved"].includes(applicationStatus);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      offeredAmount: Number(form.get("offeredAmount")),
      interestRate: Number(form.get("interestRate")) / 100,
      termMonths: Number(form.get("termMonths")),
      conditions: form.get("conditions") || undefined,
    };

    const res = await fetch(`/api/applications/${applicationId}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setCreateOpen(false);
      router.refresh();
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch(`/api/applications/${applicationId}/offers/generate`, {
      method: "POST",
    });
    setGenerating(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to generate offer");
    }
  }

  async function handleSubmitForReview(offerId: string) {
    const res = await fetch(`/api/applications/${applicationId}/offers/${offerId}/submit`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Failed to submit offer for review");
    }
    router.refresh();
  }

  async function handleReview(offerId: string, action: "approve" | "reject") {
    const reviewNotes = action === "reject" ? prompt("Rejection reason:") : undefined;
    if (action === "reject" && reviewNotes === null) return;

    const res = await fetch(`/api/applications/${applicationId}/offers/${offerId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNotes }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to review offer");
    }
  }

  async function handleDelete(offerId: string) {
    if (!confirm("Delete this offer?")) return;
    const res = await fetch(`/api/applications/${applicationId}/offers/${offerId}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger>
              <Button size="sm">
                <Plus className="mr-1 size-4" />
                Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Manual Offer</DialogTitle>
                <DialogDescription>
                  Define offer terms manually. The offer will be created as a draft.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="offeredAmount">Offered Amount ($)</Label>
                  <Input id="offeredAmount" name="offeredAmount" type="number" min="1" step="1" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input id="interestRate" name="interestRate" type="number" min="0" max="100" step="0.01" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="termMonths">Term (months)</Label>
                  <Input id="termMonths" name="termMonths" type="number" min="1" defaultValue="360" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="conditions">Conditions</Label>
                  <textarea
                    id="conditions"
                    name="conditions"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <Button type="submit">Create Draft Offer</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        {canGenerate && canGenerateForStatus && (
          <Button size="sm" variant="secondary" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="mr-1 size-4" />
            {generating ? "Generating..." : "AI Generate Offer"}
          </Button>
        )}
      </div>

      {offers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No offers yet. Create one manually or use AI generation.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {formatCurrency(offer.offeredAmount)} at{" "}
                    {(Number(offer.interestRate) * 100).toFixed(2)}%
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {offer.isAiGenerated && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Sparkles className="size-3" />
                        AI
                      </Badge>
                    )}
                    <Badge variant={OFFER_STATUS_VARIANT[offer.status] ?? "outline"}>
                      {OFFER_STATUS_LABELS[offer.status] ?? offer.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Term:</span>{" "}
                    {offer.termMonths} months
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly:</span>{" "}
                    {formatCurrency(offer.monthlyPayment)}
                  </div>
                  {offer.expiresAt && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Expires:</span>{" "}
                      {new Date(offer.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {offer.conditions && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <p className="text-muted-foreground font-medium mb-1">Conditions:</p>
                      <p className="whitespace-pre-line">{offer.conditions}</p>
                    </div>
                  </>
                )}
                {offer.reviewNotes && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <p className="text-muted-foreground font-medium mb-1">Review Notes:</p>
                      <p>{offer.reviewNotes}</p>
                    </div>
                  </>
                )}
                <div className="flex gap-2 pt-1">
                  {offer.status === "draft" && canCreate && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSubmitForReview(offer.id)}
                      >
                        <Send className="mr-1 size-3" />
                        Submit for Review
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(offer.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </>
                  )}
                  {offer.status === "pending_review" && canReview && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleReview(offer.id, "approve")}
                      >
                        <CheckCircle className="mr-1 size-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(offer.id, "reject")}
                      >
                        <XCircle className="mr-1 size-3" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
