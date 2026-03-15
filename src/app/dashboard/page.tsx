import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Shield, Settings } from "lucide-react";
import { ROLES } from "@/lib/permissions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const roleLabel = ROLES.find((r) => r.value === session.user.role)?.label ?? session.user.role;

  const cards = [
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

  const visibleCards = cards.filter((card) => card.roles.includes(session.user.role));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name ?? session.user.email}.{" "}
          <Badge variant="secondary">{roleLabel}</Badge>
        </p>
      </div>

      {visibleCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <a key={card.href} href={card.href}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                    <Icon className="size-5 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{card.description}</CardDescription>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
