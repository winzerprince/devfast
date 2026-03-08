"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center pt-[calc(0.75rem+env(safe-area-inset-top))] px-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Brand + heading */}
      <div className="flex flex-col items-center gap-4 pt-8 pb-10 px-6">
        <div className="bg-primary/10 rounded-2xl p-4">
          <Coffee className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your DevFast account</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSignIn} className="flex-1 flex flex-col px-6 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-base"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 text-base"
            required
          />
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            className="w-full min-h-[52px] text-base font-semibold active:scale-[0.98] transition-transform"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
