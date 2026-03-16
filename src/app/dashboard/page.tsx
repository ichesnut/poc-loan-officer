import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Shield,
  Settings,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { ROLES } from "@/lib/permissions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  conditionally_approved: "Cond. Approved",
  declined: "Declined",
  closing: "Closing",
  closed: "Closed",
  withdrawn: "Withdrawn",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  in_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  conditionally_approved: "bg-lime-100 text-lime-800",
  declined: "bg-red-100 text-red-800",
  closing: "bg-purple-100 text-purple-800",
  closed: "bg-emerald-100 text-emerald-800",
  withdrawn: "bg-orange-100 text-orange-800",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const roleLabel =
    ROLES.find((r) => r.value === session.user.role)?.label ?? session.user.role;

  const canViewLoans = hasPermission(session.user.role, "loans.list");

  const where =
    session.user.role === "admin" || session.user.role === "branch_manager"
      ? {}
      : { officerId: session.user.id };

  // Fetch stats server-side (skip API round-trip)
  const [applications, statusCounts, recentTransitions] = canViewLoans
    ? await Promise.all([
        prisma.loanApplication.findMany({
          where,
          select: {
            id: true,
            status: true,
            requestedAmount: true,
            updatedAt: true,
          },
        }),
        prisma.loanApplication.groupBy({
          by: ["status"],
          where,
          _count: { id: true },
          _sum: { requestedAmount: true },
        }),
        prisma.statusTransition.findMany({
          where: where.officerId
            ? { application: { officerId: where.officerId } }
            : {},
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            application: {
              select: {
                loanNumber: true,
                borrowers: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        }),
      ])
    : [[], [], []];

  const totalApplications = applications.length;
  const totalVolume = applications.reduce(
    (sum, app) => sum + Number(app.requestedAmount),
    0
  );
  const now = new Date();
  const avgDaysInStatus =
    totalApplications > 0
      ? Math.round(
          (applications.reduce((sum, app) => {
            return (
              sum +
              (now.getTime() - new Date(app.updatedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
          }, 0) /
            totalApplications) *
            10
        ) / 10
      : 0;

  const byStatus = statusCounts.map((s) => ({
    status: s.status,
    count: s._count.id,
    volume: Number(s._sum.requestedAmount ?? 0),
  }));

  const activeStatuses = ["submitted", "in_review", "approved", "conditionally_approved", "closing"];
  const activeCount = byStatus
    .filter((s) => activeStatuses.includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const navCards = [
    {
      title: "Loan Applications",
      description: "Create and manage loan applications",
      icon: FileText,
      href: "/applications",
      roles: ["admin", "branch_manager", "loan_officer", "processor", "underwriter"],
    },
    {
      title: "Users",
      description: "Manage system users and roles",
      icon: Users,
      href: "/admin/users",
      roles: ["admin", "branch_manager"],
    },
    {
      title: "Groups",
      description: "Organize users into groups",
      icon: Shield,
      href: "/admin/groups",
      roles: ["admin", "branch_manager"],
    },
    {
      title: "Permissions",
      description: "View and manage role permissions",
      icon: FileText,
      href: "/admin/permissions",
      roles: ["admin"],
    },
    {
      title: "System Config",
      description: "Application settings and configuration",
      icon: Settings,
      href: "/admin/config",
      roles: ["admin"],
    },
  ];

  const visibleCards = navCards.filter((card) =>
    card.roles.includes(session.user.role)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name ?? session.user.email}.{" "}
          <Badge variant="secondary">{roleLabel}</Badge>
        </p>
      </div>

      {/* Analytics Cards */}
      {canViewLoans && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <FileText className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                {activeCount} active in pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <DollarSign className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Loan Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalVolume)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total requested amount
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <Clock className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Avg. Days in Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgDaysInStatus}</div>
              <p className="text-xs text-muted-foreground">
                Since last status change
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Pipeline Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">
                Applications in progress
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {canViewLoans && byStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Applications by Status</CardTitle>
            <CardDescription>
              Breakdown of all loan applications in the pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byStatus
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(item.volume)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Feed */}
      {canViewLoans && recentTransitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Last 10 status transitions across applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransitions.map((t) => {
                const borrower = t.application.borrowers[0];
                const label = borrower
                  ? `${borrower.firstName} ${borrower.lastName}`
                  : t.application.loanNumber;
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="shrink-0 text-xs text-muted-foreground w-16">
                      {timeAgo(new Date(t.createdAt))}
                    </span>
                    <span className="font-medium truncate max-w-[140px]">
                      {label}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.fromStatus] ?? "bg-gray-100"}`}
                    >
                      {STATUS_LABELS[t.fromStatus] ?? t.fromStatus}
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.toStatus] ?? "bg-gray-100"}`}
                    >
                      {STATUS_LABELS[t.toStatus] ?? t.toStatus}
                    </span>
                    {t.reason && (
                      <span className="text-xs text-muted-foreground truncate">
                        {t.reason}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Cards */}
      {visibleCards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCards.map((card) => {
              const Icon = card.icon;
              return (
                <a key={card.href} href={card.href}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                      <Icon className="size-5 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{card.description}</CardDescription>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
