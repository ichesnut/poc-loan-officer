"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DocumentCategorySchema,
  DocumentStatusSchema,
} from "@/lib/schemas/loan-application";

type Document = {
  id: string;
  name: string;
  category: string;
  status: string;
  uploadedBy: string | null;
  uploadedAt: string;
  notes: string | null;
  filePath: string | null;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  received: "secondary",
  verified: "default",
  rejected: "destructive",
};

export function DocumentsSection({
  applicationId,
  canEdit,
}: {
  applicationId: string;
  canEdit: boolean;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/applications/${applicationId}/documents`);
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(doc: Document) {
    setEditing(doc);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const body = {
      name: form.get("name") as string,
      category: form.get("category") as string,
      status: form.get("status") as string,
      uploadedBy: (form.get("uploadedBy") as string) || undefined,
      notes: (form.get("notes") as string) || undefined,
      filePath: (form.get("filePath") as string) || undefined,
    };

    if (editing) {
      const res = await fetch(
        `/api/applications/${applicationId}/documents/${editing.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const res = await fetch(`/api/applications/${applicationId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/applications/${applicationId}/documents/${id}`, {
      method: "DELETE",
    });
    fetchData();
  }

  async function handleStatusChange(doc: Document, newStatus: string) {
    const res = await fetch(
      `/api/applications/${applicationId}/documents/${doc.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );
    if (res.ok) {
      fetchData();
    }
  }

  const categories = DocumentCategorySchema.options;
  const statuses = DocumentStatusSchema.options;

  const statusCounts = documents.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {statuses.map((s) => (
            <div key={s} className="text-sm text-muted-foreground">
              {DOCUMENT_STATUS_LABELS[s]}:{" "}
              <span className="font-semibold text-foreground">
                {statusCounts[s] || 0}
              </span>
            </div>
          ))}
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" onClick={openCreate} />}>
              <Plus className="mr-1 size-4" />
              Add Document
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Document" : "Add Document"}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Update document details."
                    : "Enter document details."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Document Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editing?.name ?? ""}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    defaultValue={editing?.category ?? "other"}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {DOCUMENT_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editing?.status ?? "pending"}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {DOCUMENT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="uploadedBy">Uploaded By</Label>
                  <Input
                    id="uploadedBy"
                    name="uploadedBy"
                    defaultValue={editing?.uploadedBy ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="filePath">File Path</Label>
                  <Input
                    id="filePath"
                    name="filePath"
                    defaultValue={editing?.filePath ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    name="notes"
                    defaultValue={editing?.notes ?? ""}
                  />
                </div>
                <Button type="submit">
                  {editing ? "Save Changes" : "Add Document"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No documents added yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
              {canEdit && <TableHead className="w-36">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>
                  {DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[doc.status] ?? "outline"}>
                    {DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
                  </Badge>
                </TableCell>
                <TableCell>{doc.uploadedBy ?? "—"}</TableCell>
                <TableCell>
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="max-w-48 truncate">
                  {doc.notes ?? "—"}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      {doc.status === "pending" && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleStatusChange(doc, "received")}
                        >
                          Received
                        </Button>
                      )}
                      {doc.status === "received" && (
                        <>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleStatusChange(doc, "verified")}
                          >
                            Verify
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleStatusChange(doc, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(doc)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(doc.id)}
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
      )}
    </div>
  );
}
