import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Wallet, Clock, ChevronDown } from "lucide-react";
import { TypewriterText } from "@/components/typewriter-text";

export default function LandingPage() {
  return (
    <div className="h-[100dvh] overflow-y-auto snap-y snap-mandatory">
      {/* Section 1 — Hero */}
      <section className="relative min-h-[100dvh] snap-start flex flex-col text-white overflow-hidden">
        {/* Background image */}
        <Image
          src="/breakfast.webp"
          alt=""
          fill
          className="object-cover scale-110 blur-[2px]"
          priority
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/65 to-orange-700/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Mobile logo pill */}
          <div className="md:hidden flex justify-center pt-[calc(1.25rem+env(safe-area-inset-top))] px-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full">
              <Image src="/logo.png" alt="EarlyBird" width={16} height={16} className="rounded" />
              <span className="font-semibold text-sm tracking-wide text-orange-600">EarlyBird</span>
            </div>
          </div>

          {/* Desktop navbar */}
          <nav className="hidden md:flex items-center justify-between px-12 h-16 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-white rounded-full p-1">
                <Image src="/logo.png" alt="EarlyBird" width={26} height={26} className="rounded" />
              </div>
              <span className="font-bold text-lg">EarlyBird</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:bg-white/10 font-semibold" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button className="bg-white text-orange-600 hover:bg-orange-50 border-0 font-semibold" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </nav>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5 md:gap-8">
            <div className="bg-white rounded-full p-6 md:p-10">
              <Image src="/logo.png" alt="EarlyBird" width={72} height={72} className="rounded-xl" />
            </div>
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                <TypewriterText text={"Good morning,\noffice team."} />
              </h1>
              <p className="text-orange-100 text-base leading-relaxed max-w-xs mx-auto md:text-lg md:max-w-lg">
                Order tomorrow&apos;s breakfast before 8 PM. Simple, prepaid, and always on time.
              </p>
            </div>
            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 border-0 px-8 h-12 font-semibold" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 border border-white/30 px-8 h-12 font-semibold" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Bottom CTAs + scroll hint — mobile only */}
          <div className="md:hidden px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col gap-3">
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
        </div>
      </section>

      {/* Section 2 — How it works */}
      <section className="min-h-[100dvh] snap-start bg-background flex flex-col px-6 py-12 md:px-16">
        <div className="flex-1 flex flex-col justify-center gap-8 max-w-md mx-auto w-full md:max-w-4xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">How it works</p>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Breakfast in 3 steps</h2>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl border bg-card active:scale-[0.98] transition-transform md:flex-col md:flex-1">
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
            <div className="flex items-start gap-4 p-4 rounded-2xl border bg-card active:scale-[0.98] transition-transform md:flex-col md:flex-1">
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
            <div className="flex items-start gap-4 p-4 rounded-2xl border bg-card active:scale-[0.98] transition-transform md:flex-col md:flex-1">
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
            className="w-full min-h-[52px] active:scale-[0.98] transition-transform text-base font-semibold md:w-auto md:px-10 md:self-start"
            asChild
          >
            <Link href="/auth/signup">Start Ordering</Link>
          </Button>
        </div>

        <footer className="pt-8 text-center text-xs text-muted-foreground pb-[env(safe-area-inset-bottom)]">
          &copy; {new Date().getFullYear()} EarlyBird
        </footer>
      </section>
    </div>
  );
}
