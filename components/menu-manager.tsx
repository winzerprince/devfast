"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles, UtensilsCrossed, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem } from "@/lib/types";

interface MenuManagerProps {
  initialItems: MenuItem[];
}

export function MenuManager({ initialItems }: MenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const supabase = createClient();

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isSpecial, setIsSpecial] = useState(false);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setPrice("");
    setDescription("");
    setIsSpecial(false);
  }

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setName(item.name);
    setPrice(String(item.price));
    setDescription(item.description || "");
    setIsSpecial(item.is_special);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({ name, price: Number(price), description, is_special: isSpecial })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`"${name}" added to menu!`);
      setItems([...items, data as MenuItem]);
      resetForm();
      setIsAddOpen(false);
    } catch {
      toast.error("Failed to add item");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ name, price: Number(price), description, is_special: isSpecial })
        .eq("id", editItem.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`"${name}" updated!`);
      setItems(items.map((i) => (i.id === editItem.id ? { ...i, name, price: Number(price), description, is_special: isSpecial } : i)));
      setEditItem(null);
      resetForm();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(item: MenuItem) {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`"${item.name}" ${item.is_active ? "disabled" : "enabled"}`);
    setItems(items.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{items.length} items</h2>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chapati + Beans" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (UGX)</label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 5000" min={1} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" rows={2} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} className="rounded" />
                Mark as special
              </label>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (UGX)</label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={1} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} className="rounded" />
              Mark as special
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={!item.is_active ? "opacity-50" : ""}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.is_special && <Sparkles className="h-4 w-4 text-orange-500" />}
                    <span className="font-medium">{item.name}</span>
                    {!item.is_active && <Badge variant="secondary" className="text-xs">Disabled</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                  <div className="text-sm font-medium">{Number(item.price).toLocaleString()} UGX</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(item)}
                    className={item.is_active ? "text-destructive" : "text-green-600"}
                  >
                    {item.is_active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
