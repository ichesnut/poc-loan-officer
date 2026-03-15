import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { ConfigForm } from "./config-form";

export default async function ConfigPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "system.config")) redirect("/unauthorized");

  const configs = await prisma.systemConfig.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-muted-foreground">Manage application-wide settings.</p>
      </div>
      <ConfigForm configs={configs} />
    </div>
  );
}
