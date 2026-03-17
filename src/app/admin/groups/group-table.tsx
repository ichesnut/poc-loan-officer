"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
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
import { Plus, Trash2, UserPlus } from "lucide-react";

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  members: {
    id: string;
    user: { id: string; email: string; name: string | null };
  }[];
};

type SimpleUser = { id: string; email: string; name: string | null };

export function GroupTable({
  groups,
  allUsers,
  canEdit,
}: {
  groups: GroupRow[];
  allUsers: SimpleUser[];
  canEdit: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [memberDialogGroup, setMemberDialogGroup] = useState<GroupRow | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || null,
      }),
    });
    setCreateOpen(false);
    window.location.reload();
  }

  async function deleteGroup(id: string) {
    await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  async function addMember(groupId: string, userId: string) {
    await fetch(`/api/admin/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    window.location.reload();
  }

  async function removeMember(groupId: string, memberId: string) {
    await fetch(`/api/admin/groups/${groupId}/members/${memberId}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <>
      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger >
              <Button size="sm">
                <Plus className="mr-1 size-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
                <DialogDescription>Add a new group for organizing users.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <Button type="submit">Create Group</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Members</TableHead>
            {canEdit && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell className="font-medium">{group.name}</TableCell>
              <TableCell>{group.description ?? "—"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {group.members.map((m) => (
                    <Badge key={m.id} variant="secondary" className="gap-1">
                      {m.user.name ?? m.user.email}
                      {canEdit && (
                        <button
                          onClick={() => removeMember(group.id, m.id)}
                          className="ml-1 text-destructive hover:text-destructive/80"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              {canEdit && (
                <TableCell>
                  <div className="flex gap-1">
                    <Dialog
                      open={memberDialogGroup?.id === group.id}
                      onOpenChange={(open) => setMemberDialogGroup(open ? group : null)}
                    >
                      <DialogTrigger >
                        <Button variant="ghost" size="icon-sm">
                          <UserPlus className="size-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Member to {group.name}</DialogTitle>
                          <DialogDescription>Select a user to add.</DialogDescription>
                        </DialogHeader>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {allUsers
                            .filter(
                              (u) => !group.members.some((m) => m.user.id === u.id)
                            )
                            .map((user) => (
                              <button
                                key={user.id}
                                onClick={() => addMember(group.id, user.id)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                              >
                                {user.name ?? user.email}
                                <span className="text-muted-foreground inline-flex items-center gap-1">
                                  {user.email}
                                  <CopyButton value={user.email} />
                                </span>
                              </button>
                            ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteGroup(group.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
