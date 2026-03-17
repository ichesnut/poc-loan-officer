"use client";

import { Badge } from "@/components/ui/badge";
import { LOAN_STATUS_LABELS } from "@/lib/schemas/loan-application";
import type { StatusTransition } from "../application-detail";

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

export function StatusWorkflow({
  transitions,
}: {
  transitions: StatusTransition[];
}) {
  if (transitions.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No status changes recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {transitions.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-md border p-3 text-sm"
        >
          <Badge variant={STATUS_VARIANT[t.fromStatus] ?? "outline"} className="shrink-0">
            {LOAN_STATUS_LABELS[t.fromStatus] ?? t.fromStatus}
          </Badge>
          <span className="text-muted-foreground">&rarr;</span>
          <Badge variant={STATUS_VARIANT[t.toStatus] ?? "outline"} className="shrink-0">
            {LOAN_STATUS_LABELS[t.toStatus] ?? t.toStatus}
          </Badge>
          <span className="flex-1 text-muted-foreground truncate">
            {t.reason ?? ""}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(t.createdAt).toLocaleString("en-US", { hour12: true })}
          </span>
        </div>
      ))}
    </div>
  );
}
