import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { UserTable } from "./user-table";

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "users.list")) redirect("/unauthorized");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { groupMemberships: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage system users and their roles.</p>
        </div>
      </div>
      <UserTable users={users} canEdit={hasPermission(session.user.role, "users.update")} />
    </div>
  );
}
