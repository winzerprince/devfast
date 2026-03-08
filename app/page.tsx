import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee, UtensilsCrossed, Wallet, Clock, ChevronDown } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="h-[100dvh] overflow-y-auto snap-y snap-mandatory">
      {/* Section 1 — Hero */}
      <section className="min-h-[100dvh] snap-start bg-gradient-to-b from-orange-500 to-orange-600 flex flex-col text-white">
        {/* Top logo pill */}
        <div className="flex justify-center pt-[calc(1.25rem+env(safe-area-inset-top))] px-6">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Coffee className="h-4 w-4" />
            <span className="font-semibold text-sm tracking-wide">DevFast</span>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6">
            <Coffee className="h-16 w-16" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              Good morning,<br />office team.
            </h1>
            <p className="text-orange-100 text-base leading-relaxed max-w-xs mx-auto">
              Order tomorrow&apos;s breakfast before 8 PM. Simple, prepaid, and always on time.
            </p>
          </div>
        </div>

        {/* Bottom CTAs + scroll hint */}
        <div className="px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col gap-3">
          <div className="flex flex-col items-center gap-1 mb-2">
            <span className="text-orange-200 text-xs">Scroll to learn more</span>
            <ChevronDown className="h-4 w-4 text-orange-200 animate-bounce" />
          </div>
          <Button
            size="lg"
            className="w-full min-h-[52px] bg-white text-orange-600 hover:bg-orange-50 active:scale-[0.98] transition-transform font-semibold text-base shadow-none border-0"
            asChild
          >
            <Link href="/auth/signup">Get Started</Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full min-h-[52px] text-white hover:bg-white/10 active:scale-[0.98] transition-transform font-semibold text-base border border-white/30"
            asChild
          >
            <Link href="/auth/signin">I already have an account</Link>
          </Button>
        </div>
      </section>

      {/* Section 2 — How it works */}
      <section className="min-h-[100dvh] snap-start bg-background flex flex-col px-6 py-12">
        <div className="flex-1 flex flex-col justify-center gap-8 max-w-md mx-auto w-full">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">How it works</p>
            <h2 className="text-2xl font-bold text-foreground">Breakfast in 3 steps</h2>
          </div>

          <div className="flex flex-col gap-4">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl border bg-card active:scale-[0.98] transition-transform">
              <div className="bg-primary/10 rounded-xl p-3 shrink-0">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground">Browse the menu</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  See today&apos;s specials and pick from a variety of breakfast items.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl border bg-card active:scale-[0.98] transition-transform">
              <div className="bg-primary/10 rounded-xl p-3 shrink-0">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground">Top up your balance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pay cash to your admin and your prepaid balance is topped up instantly.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl border bg-card active:scale-[0.98] transition-transform">
              <div className="bg-primary/10 rounded-xl p-3 shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground">Order by 8 PM</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Place your order before the cutoff and breakfast arrives tomorrow.
                </p>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full min-h-[52px] active:scale-[0.98] transition-transform text-base font-semibold"
            asChild
          >
            <Link href="/auth/signup">Start Ordering</Link>
          </Button>
        </div>

        <footer className="pt-8 text-center text-xs text-muted-foreground pb-[env(safe-area-inset-bottom)]">
          &copy; {new Date().getFullYear()} DevFast
        </footer>
      </section>
    </div>
  );
}
