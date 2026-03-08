"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles, Pencil, ImageIcon, X, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { MenuItem } from "@/lib/types";

interface MenuManagerProps {
  initialItems: MenuItem[];
}

export function MenuManager({ initialItems }: MenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const supabase = createClient();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isSpecial, setIsSpecial] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteBlockedId, setDeleteBlockedId] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setPrice("");
    setDescription("");
    setIsSpecial(false);
    setImageFile(null);
    setImagePreview(null);
  }

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setName(item.name);
    setPrice(String(item.price));
    setDescription(item.description || "");
    setIsSpecial(item.is_special);
    setImageFile(null);
    setImagePreview(item.image_url);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("menu-images")
      .upload(path, file);

    if (error) {
      toast.error("Image upload failed: " + error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("menu-images")
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url: string | null = null;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
        if (image_url === null && imageFile) {
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("menu_items")
        .insert({ name, price: Number(price), description, is_special: isSpecial, image_url })
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
      let image_url = editItem.image_url;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded === null) {
          setLoading(false);
          return;
        }
        image_url = uploaded;
      }

      const { error } = await supabase
        .from("menu_items")
        .update({ name, price: Number(price), description, is_special: isSpecial, image_url })
        .eq("id", editItem.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`"${name}" updated!`);
      setItems(items.map((i) => (i.id === editItem.id ? { ...i, name, price: Number(price), description, is_special: isSpecial, image_url } : i)));
      setEditItem(null);
      resetForm();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(item: MenuItem) {
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      if (error.code === "23503") {
        setDeleteBlockedId(item.id);
      } else {
        toast.error(error.message);
      }
      setConfirmDeleteId(null);
      return;
    }

    toast.success(`"${item.name}" deleted`);
    setItems(items.filter((i) => i.id !== item.id));
    setConfirmDeleteId(null);
  }


  const imageField = (
    <div className="space-y-2">
      <label className="text-sm font-medium">Image</label>
      {imagePreview && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border">
          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 bg-background/80 rounded-full"
            onClick={() => { setImageFile(null); setImagePreview(null); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <Input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
    </div>
  );

  const itemForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
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
      {imageField}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} className="rounded" />
        Mark as special
      </label>
      <Button type="submit" className="w-full min-h-[48px]" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{items.length} items</span>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="active:scale-[0.97] transition-transform">
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
            </DialogHeader>
            {itemForm(handleAdd, "Add Item")}
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {itemForm(handleUpdate, "Save Changes")}
        </DialogContent>
      </Dialog>

      {/* Food-app style grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border bg-card overflow-hidden flex flex-col"
          >
            {/* Image area */}
            <div className="relative w-full h-44 bg-muted shrink-0">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}

              {/* Overlaid badges — top left */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {item.is_special && (
                  <Badge className="bg-primary text-primary-foreground gap-1 shadow-sm text-xs">
                    <Sparkles className="h-3 w-3" /> Special
                  </Badge>
                )}
              </div>

              {/* Edit button — top right */}
              <button
                onClick={() => openEdit(item)}
                className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-sm active:scale-95 transition-transform"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Content area */}
            <div className="p-4 flex flex-col gap-3 flex-1">
              <div className="flex-1">
                <h3 className="font-semibold leading-tight">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {deleteBlockedId === item.id ? (
                <div className="flex items-start gap-2 rounded-xl bg-destructive/8 border border-destructive/20 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-destructive leading-snug">This item has existing orders and can't be removed.</p>
                  </div>
                  <button
                    onClick={() => setDeleteBlockedId(null)}
                    className="shrink-0 text-destructive/60 hover:text-destructive active:scale-95 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-bold shrink-0">
                    {Number(item.price).toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1">UGX</span>
                  </span>
                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => deleteItem(item)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-destructive/40 bg-destructive/10 text-destructive active:scale-95 transition-transform"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-background active:scale-95 transition-transform"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-2 rounded-full border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 active:scale-95 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
