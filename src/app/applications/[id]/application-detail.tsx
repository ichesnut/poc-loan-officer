"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, ShieldOff } from "lucide-react";
import {
  LOAN_PURPOSE_LABELS,
  LOAN_STATUS_LABELS,
  LOAN_TYPE_LABELS,
} from "@/lib/schemas/loan-application";
import { TRANSITION_LABELS, TRANSITION_VARIANTS } from "@/lib/workflow";
import { BorrowerSection } from "./sections/borrower-section";
import { IncomeSection } from "./sections/income-section";
import { ExpenseSection } from "./sections/expense-section";
import { CollateralSection } from "./sections/collateral-section";
import { OfferSection } from "./sections/offer-section";
import { StatusWorkflow } from "./sections/status-workflow";

type Application = {
  id: string;
  loanNumber: string;
  status: string;
  loanType: string;
  purpose: string;
  requestedAmount: string | number;
  termMonths: number;
  interestRate: string | number | null;
  notes: string | null;
  officerId: string;
  createdAt: string;
  updatedAt: string;
  officer: { id: string; name: string | null; email: string };
  borrowers: Borrower[];
  incomes: Income[];
  expenses: Expense[];
  collateral: CollateralAsset[];
  offers: Offer[];
  statusTransitions: StatusTransition[];
};

export type Borrower = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  ssn: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isPrimary: boolean;
};

export type Income = {
  id: string;
  type: string;
  source: string;
  monthlyAmount: string | number;
  isVerified: boolean;
  notes: string | null;
};

export type Expense = {
  id: string;
  type: string;
  description: string;
  monthlyAmount: string | number;
  notes: string | null;
};

export type CollateralAsset = {
  id: string;
  type: string;
  description: string;
  estimatedValue: string | number;
  appraisedValue: string | number | null;
  lienPosition: number | null;
  notes: string | null;
};

export type Offer = {
  id: string;
  offeredAmount: string | number;
  interestRate: string | number;
  termMonths: number;
  monthlyPayment: string | number;
  conditions: string | null;
  status: string;
  isAiGenerated: boolean;
  createdById: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type StatusTransition = {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  performedById: string;
  createdAt: string;
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
  }).format(Number(value));
}

function calculateLTV(requestedAmount: string | number, collateral: CollateralAsset[]): number | null {
  const totalCollateral = collateral.reduce(
    (sum, c) => sum + Number(c.appraisedValue ?? c.estimatedValue),
    0
  );
  if (totalCollateral === 0) return null;
  return Number(requestedAmount) / totalCollateral;
}

export function ApplicationDetail({
  application,
  canEdit,
  canCreateOffers,
  canReviewOffers,
  canGenerateOffers,
  availableTransitions,
  userRole,
}: {
  application: Application;
  canEdit: boolean;
  canCreateOffers: boolean;
  canReviewOffers: boolean;
  canGenerateOffers: boolean;
  availableTransitions: string[];
  userRole: string;
}) {
  const router = useRouter();
  const ltv = application.loanType === "secured"
    ? calculateLTV(application.requestedAmount, application.collateral)
    : null;

  async function handleTransition(targetStatus: string) {
    const reason = targetStatus === "declined" || targetStatus === "withdrawn"
      ? prompt("Reason for this action:")
      : undefined;

    if ((targetStatus === "declined" || targetStatus === "withdrawn") && reason === null) return;

    const res = await fetch(`/api/applications/${application.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus, reason }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to transition status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/applications")}>
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Application {application.loanNumber.slice(0, 8)}
            </h1>
            <Badge variant={STATUS_VARIANT[application.status] ?? "outline"}>
              {LOAN_STATUS_LABELS[application.status] ?? application.status}
            </Badge>
            <Badge variant="outline" className="gap-1">
              {application.loanType === "secured" ? (
                <Shield className="size-3" />
              ) : (
                <ShieldOff className="size-3" />
              )}
              {LOAN_TYPE_LABELS[application.loanType] ?? application.loanType}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Officer: {application.officer.name ?? application.officer.email}
          </p>
        </div>
        {/* Status transition buttons */}
        {availableTransitions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {availableTransitions.map((target) => (
              <Button
                key={target}
                size="sm"
                variant={TRANSITION_VARIANTS[target] ?? "outline"}
                onClick={() => handleTransition(target)}
              >
                {TRANSITION_LABELS[target] ?? target}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Purpose
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {LOAN_PURPOSE_LABELS[application.purpose] ?? application.purpose}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requested Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCurrency(application.requestedAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Term
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{application.termMonths} months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interest Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {application.interestRate
                ? `${(Number(application.interestRate) * 100).toFixed(2)}%`
                : "Not set"}
            </p>
          </CardContent>
        </Card>
        {application.loanType === "secured" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                LTV Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {ltv !== null ? `${(ltv * 100).toFixed(1)}%` : "N/A"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabbed sections */}
      <Tabs defaultValue="borrowers">
        <TabsList variant="line">
          <TabsTrigger value="borrowers">
            Borrowers ({application.borrowers.length})
          </TabsTrigger>
          <TabsTrigger value="income">
            Income ({application.incomes.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Expenses ({application.expenses.length})
          </TabsTrigger>
          <TabsTrigger value="collateral">
            Collateral ({application.collateral.length})
          </TabsTrigger>
          <TabsTrigger value="offers">
            Offers ({application.offers.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({application.statusTransitions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="borrowers" className="pt-4">
          <BorrowerSection
            applicationId={application.id}
            borrowers={application.borrowers}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="income" className="pt-4">
          <IncomeSection
            applicationId={application.id}
            incomes={application.incomes}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="expenses" className="pt-4">
          <ExpenseSection
            applicationId={application.id}
            expenses={application.expenses}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="collateral" className="pt-4">
          <CollateralSection
            applicationId={application.id}
            assets={application.collateral}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="offers" className="pt-4">
          <OfferSection
            applicationId={application.id}
            offers={application.offers}
            canCreate={canCreateOffers}
            canReview={canReviewOffers}
            canGenerate={canGenerateOffers}
            applicationStatus={application.status}
          />
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <StatusWorkflow transitions={application.statusTransitions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
