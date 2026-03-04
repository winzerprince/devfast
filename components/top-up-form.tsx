"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { Profile, TopUpResult } from "@/lib/types";

interface TopUpFormProps {
  user: Profile;
}

export function TopUpForm({ user }: TopUpFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("admin_topup", {
        p_user_id: user.id,
        p_amount: Number(amount),
        p_description: description || `Cash top-up`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const result = data as unknown as TopUpResult;
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Added ${Number(amount).toLocaleString()} UGX to ${user.full_name}'s balance. New balance: ${Number(result.new_balance).toLocaleString()} UGX`);
      setAmount("");
      setDescription("");
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error("Failed to add funds");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3 w-3 mr-1" />
          Top Up
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Top Up — {user.full_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleTopUp} className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current balance: <strong>{Number(user.balance).toLocaleString()} UGX</strong>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (UGX)</label>
            <Input
              type="number"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea
              placeholder="e.g. Cash payment March 5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {amount ? Number(amount).toLocaleString() : "0"} UGX
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
