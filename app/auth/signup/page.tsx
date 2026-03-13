"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Check your email to verify your account!");
      router.push("/auth/verify");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop left brand panel */}
      <div className="hidden md:flex relative overflow-hidden flex-col items-center justify-center w-[420px] shrink-0 text-white p-12">
        <Image
          src="/breakfast.webp"
          alt=""
          fill
          className="object-cover scale-110 blur-[2px]"
          priority
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/65 to-orange-700/70" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-primary/10 rounded-full p-8 mb-8">
            <Image src="/logo.png" alt="EarlyBird" width={72} height={72} className="rounded-xl" />
          </div>
          <h2 className="text-2xl font-bold mb-3">EarlyBird</h2>
          <p className="text-orange-100 text-center text-sm leading-relaxed max-w-[200px]">
            Breakfast order &amp; subscription management for your office team.
          </p>
        </div>
      </div>

      {/* Right panel / full page on mobile */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center pt-[calc(0.75rem+env(safe-area-inset-top))] px-4 md:hidden">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
        </div>

        {/* Mobile brand + heading */}
        <div className="flex flex-col items-center gap-4 pt-8 pb-10 px-6 md:hidden">
          <div className="bg-primary/10 rounded-full p-4">
            <Image src="/logo.png" alt="EarlyBird" width={40} height={40} className="rounded-lg" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-sm">Join EarlyBird and start ordering breakfast</p>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col md:items-center md:justify-center md:px-16">
          {/* Desktop heading */}
          <div className="hidden md:block mb-8 w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Join EarlyBird and start ordering breakfast</p>
          </div>

          <form onSubmit={handleSignUp} className="flex-1 flex flex-col px-6 gap-5 md:flex-none md:w-full md:max-w-sm md:px-0">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>

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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base"
                minLength={6}
                required
              />
            </div>

            <div className="flex-1 md:hidden" />

            <div className="flex flex-col gap-4 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-0">
              <Button
                type="submit"
                className="w-full min-h-[52px] text-base font-semibold active:scale-[0.98] transition-transform"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Desktop back link */}
        <div className="hidden md:flex justify-center py-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
