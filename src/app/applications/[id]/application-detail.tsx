"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import {
  LOAN_PURPOSE_LABELS,
  LOAN_STATUS_LABELS,
} from "@/lib/schemas/loan-application";
import { BorrowerSection } from "./sections/borrower-section";
import { IncomeSection } from "./sections/income-section";
import { ExpenseSection } from "./sections/expense-section";
import { CollateralSection } from "./sections/collateral-section";

type Application = {
  id: string;
  loanNumber: string;
  status: string;
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
  notes: string | null;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  in_review: "secondary",
  approved: "default",
  denied: "destructive",
  funded: "default",
  closed: "outline",
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function ApplicationDetail({
  application,
  canEdit,
}: {
  application: Application;
  canEdit: boolean;
}) {
  const router = useRouter();

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
          </div>
          <p className="text-muted-foreground">
            Officer: {application.officer.name ?? application.officer.email}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </Tabs>
    </div>
  );
}
