import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, getAllPermissions, getRolesForPermission, ROLES } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";

export default async function PermissionsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "system.config")) redirect("/unauthorized");

  const permissions = getAllPermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permission Matrix</h1>
        <p className="text-muted-foreground">
          View which roles have access to each action in the system.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Permission</TableHead>
              {ROLES.map((role) => (
                <TableHead key={role.value} className="text-center">
                  <Badge variant="secondary">{role.label}</Badge>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((perm) => {
              const allowedRoles = getRolesForPermission(perm);
              return (
                <TableRow key={perm}>
                  <TableCell className="font-mono text-sm">{perm}</TableCell>
                  {ROLES.map((role) => (
                    <TableCell key={role.value} className="text-center">
                      {allowedRoles.includes(role.value) ? (
                        <Check className="mx-auto size-4 text-green-600" />
                      ) : (
                        <X className="mx-auto size-4 text-muted-foreground/30" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
