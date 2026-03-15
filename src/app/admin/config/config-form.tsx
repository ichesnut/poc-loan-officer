"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Save, Trash2 } from "lucide-react";

type Config = { id: string; key: string; value: string };

export function ConfigForm({ configs }: { configs: Config[] }) {
  const [items, setItems] = useState(configs);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  async function saveConfig(key: string, value: string) {
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function addConfig() {
    if (!newKey) return;
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: newKey, value: newValue }),
    });
    if (res.ok) {
      const config = await res.json();
      setItems([...items, config]);
      setNewKey("");
      setNewValue("");
    }
  }

  async function deleteConfig(id: string, key: string) {
    await fetch(`/api/admin/config?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-mono text-sm">{config.key}</TableCell>
                <TableCell>
                  <Input
                    defaultValue={config.value}
                    onBlur={(e) => saveConfig(config.key, e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteConfig(config.id, config.key)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex gap-2 border-t pt-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="newKey" className="text-xs">
              Key
            </Label>
            <Input
              id="newKey"
              placeholder="config.key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="newValue" className="text-xs">
              Value
            </Label>
            <Input
              id="newValue"
              placeholder="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
          <div className="flex flex-col justify-end">
            <Button onClick={addConfig} size="sm">
              <Plus className="mr-1 size-4" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
