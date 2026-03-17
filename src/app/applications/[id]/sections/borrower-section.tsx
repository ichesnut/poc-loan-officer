"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import type { Borrower } from "../application-detail";

export function BorrowerSection({
  applicationId,
  borrowers,
  canEdit,
}: {
  applicationId: string;
  borrowers: Borrower[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Borrower | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(b: Borrower) {
    setEditing(b);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      firstName: form.get("firstName") as string,
      lastName: form.get("lastName") as string,
      email: (form.get("email") as string) || undefined,
      phone: (form.get("phone") as string) || undefined,
      address: (form.get("address") as string) || undefined,
      city: (form.get("city") as string) || undefined,
      state: (form.get("state") as string) || undefined,
      zipCode: (form.get("zipCode") as string) || undefined,
      isPrimary: form.get("isPrimary") === "on",
    };

    const url = editing
      ? `/api/applications/${applicationId}/borrowers/${editing.id}`
      : `/api/applications/${applicationId}/borrowers`;
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setDialogOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/applications/${applicationId}/borrowers/${id}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" onClick={openCreate} />}>
              <Plus className="mr-1 size-4" />
              Add Borrower
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Borrower" : "Add Borrower"}</DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Update borrower information."
                    : "Enter borrower details."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={editing?.firstName}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={editing?.lastName}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editing?.email ?? ""}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={editing?.phone ?? ""}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editing?.address ?? ""}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={editing?.city ?? ""}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      defaultValue={editing?.state ?? ""}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      defaultValue={editing?.zipCode ?? ""}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="isPrimary"
                    name="isPrimary"
                    type="checkbox"
                    defaultChecked={editing?.isPrimary}
                    className="size-4 rounded border-input"
                  />
                  <Label htmlFor="isPrimary">Primary Borrower</Label>
                </div>
                <Button type="submit">{editing ? "Save Changes" : "Add Borrower"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {borrowers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No borrowers added yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {borrowers.map((b) => (
            <Card key={b.id}>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <User className="size-5 text-muted-foreground" />
                <CardTitle className="flex-1 text-base">
                  {b.firstName} {b.lastName}
                  {b.isPrimary && (
                    <Badge variant="secondary" className="ml-2">
                      Primary
                    </Badge>
                  )}
                </CardTitle>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(b)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                {b.email && (
                  <p className="inline-flex items-center gap-1">
                    {b.email}
                    <CopyButton value={b.email} />
                  </p>
                )}
                {b.phone && <p>{b.phone}</p>}
                {b.address && (
                  <p>
                    {b.address}
                    {b.city && `, ${b.city}`}
                    {b.state && `, ${b.state}`}
                    {b.zipCode && ` ${b.zipCode}`}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
