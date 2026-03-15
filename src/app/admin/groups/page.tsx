import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { GroupTable } from "./group-table";

export default async function GroupsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "groups.list")) redirect("/unauthorized");

  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
    },
  });

  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
        <p className="text-muted-foreground">Organize users into groups for team management.</p>
      </div>
      <GroupTable
        groups={groups}
        allUsers={allUsers}
        canEdit={hasPermission(session.user.role, "groups.create")}
      />
    </div>
  );
}
