"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLES } from "@/lib/permissions";
import { Pencil, Plus, UserCheck, UserX } from "lucide-react";
import type { Role } from "@/generated/prisma/client";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  _count: { groupMemberships: number };
};

export function UserTable({ users, canEdit }: { users: UserRow[]; canEdit: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  function openCreate() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      email: form.get("email") as string,
      name: (form.get("name") as string) || null,
      role: form.get("role") as Role,
      password: (form.get("password") as string) || undefined,
    };

    const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
    const method = editingUser ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setDialogOpen(false);
      window.location.reload();
    }
  }

  async function toggleActive(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    window.location.reload();
  }

  return (
    <>
      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger >
              <Button onClick={openCreate} size="sm">
                <Plus className="mr-1 size-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update user details below."
                    : "Fill in the details for the new user."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingUser?.email}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={editingUser?.name ?? ""} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    defaultValue={editingUser?.role ?? "loan_officer"}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">
                    Password{editingUser ? " (leave blank to keep)" : ""}
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required={!editingUser}
                  />
                </div>
                <Button type="submit">{editingUser ? "Save Changes" : "Create User"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Groups</TableHead>
            <TableHead>Status</TableHead>
            {canEdit && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const roleLabel = ROLES.find((r) => r.value === user.role)?.label ?? user.role;
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabel}</Badge>
                </TableCell>
                <TableCell>{user._count.groupMemberships}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "outline"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(user)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => toggleActive(user)}>
                        {user.isActive ? (
                          <UserX className="size-4" />
                        ) : (
                          <UserCheck className="size-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
