"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  LOAN_STATUS_LABELS,
  LOAN_TYPE_LABELS,
} from "@/lib/schemas/loan-application";

// Pipeline columns — the active statuses loan officers care about
const PIPELINE_COLUMNS = [
  "draft",
  "submitted",
  "in_review",
  "approved",
  "closing",
] as const;

type PipelineStatus = (typeof PIPELINE_COLUMNS)[number];

const COLUMN_COLORS: Record<PipelineStatus, string> = {
  draft: "bg-muted/60",
  submitted: "bg-blue-500/10",
  in_review: "bg-amber-500/10",
  approved: "bg-green-500/10",
  closing: "bg-purple-500/10",
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  in_review: "secondary",
  approved: "default",
  closing: "default",
};

type ApplicationCard = {
  id: string;
  loanNumber: string;
  status: string;
  loanType: string;
  purpose: string;
  requestedAmount: string | number;
  updatedAt: string;
  officer: { id: string; name: string | null; email: string };
  borrowers: { firstName: string; lastName: string }[];
  statusTransitions: { createdAt: string }[];
};

type Officer = { id: string; name: string | null; email: string };

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function daysInStatus(app: ApplicationCard): number {
  // Use the most recent status transition date, or updatedAt as fallback
  const since = app.statusTransitions[0]?.createdAt ?? app.updatedAt;
  const diff = Date.now() - new Date(since).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function WorklistPipeline({
  applications,
  officers,
}: {
  applications: ApplicationCard[];
  officers: Officer[];
}) {
  const router = useRouter();
  const [filterLoanType, setFilterLoanType] = useState("all");
  const [filterOfficer, setFilterOfficer] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = applications.filter((app) => {
    if (filterLoanType !== "all" && app.loanType !== filterLoanType) return false;
    if (filterOfficer !== "all" && app.officer.id !== filterOfficer) return false;
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    return true;
  });

  // Group by status into pipeline columns
  const columns = PIPELINE_COLUMNS.map((status) => ({
    status,
    label: LOAN_STATUS_LABELS[status] ?? status,
    apps: filtered.filter((a) => a.status === status),
  }));

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-status">Status</Label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Active</option>
            {PIPELINE_COLUMNS.map((s) => (
              <option key={s} value={s}>
                {LOAN_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-type">Loan Type</Label>
          <select
            id="filter-type"
            value={filterLoanType}
            onChange={(e) => setFilterLoanType(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Types</option>
            <option value="secured">{LOAN_TYPE_LABELS.secured}</option>
            <option value="unsecured">{LOAN_TYPE_LABELS.unsecured}</option>
          </select>
        </div>
        {officers.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-officer">Officer</Label>
            <select
              id="filter-officer"
              value={filterOfficer}
              onChange={(e) => setFilterOfficer(e.target.value)}
              className={selectClass}
            >
              <option value="all">All Officers</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name ?? o.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pipeline columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {columns
          .filter((col) => filterStatus === "all" || col.status === filterStatus)
          .map((col) => (
            <div key={col.status} className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-sm font-semibold">{col.label}</span>
                <Badge variant="outline" className="text-xs">
                  {col.apps.length}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {col.apps.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No applications
                  </p>
                )}
                {col.apps.map((app) => {
                  const borrower = app.borrowers[0];
                  const days = daysInStatus(app);
                  return (
                    <Card
                      key={app.id}
                      size="sm"
                      className={`cursor-pointer transition-shadow hover:ring-2 hover:ring-ring/30 ${COLUMN_COLORS[col.status]}`}
                      onClick={() => router.push(`/applications/${app.id}`)}
                    >
                      <CardHeader className="pb-0">
                        <CardTitle className="flex items-center justify-between">
                          <span className="truncate">
                            {borrower
                              ? `${borrower.firstName} ${borrower.lastName}`
                              : "No borrower"}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {formatCurrency(app.requestedAmount)}
                          </span>
                          <Badge
                            variant={STATUS_BADGE_VARIANT[app.status] ?? "outline"}
                            className="text-[10px]"
                          >
                            {LOAN_TYPE_LABELS[app.loanType]}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{app.officer.name ?? app.officer.email}</span>
                          <span>
                            {days === 0 ? "Today" : `${days}d`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
