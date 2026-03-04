import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee, ArrowRight, UtensilsCrossed, Wallet, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Coffee className="h-5 w-5 text-orange-500" />
            <span>DevFast</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-8 py-20">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium">
            <Coffee className="h-4 w-4" />
            Breakfast made easy for your team
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Order tomorrow&apos;s breakfast{" "}
            <span className="text-orange-500">today</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Simple breakfast ordering for office teams. Pick your meal, track your balance, and never miss breakfast again.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Start Ordering <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signin">I have an account</Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
            <div className="space-y-2 p-4 rounded-lg border bg-card">
              <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              <h3 className="font-semibold">Browse Menu</h3>
              <p className="text-sm text-muted-foreground">
                See today&apos;s specials and choose from a variety of breakfast items.
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-lg border bg-card">
              <Wallet className="h-8 w-8 text-orange-500" />
              <h3 className="font-semibold">Prepaid Balance</h3>
              <p className="text-sm text-muted-foreground">
                Pay cash to your admin and your balance gets topped up instantly.
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-lg border bg-card">
              <Clock className="h-8 w-8 text-orange-500" />
              <h3 className="font-semibold">Order by 8 PM</h3>
              <p className="text-sm text-muted-foreground">
                Place orders before 8 PM for next-day breakfast delivery.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} DevFast. Built with Next.js + Supabase.</p>
      </footer>
    </div>
  );
}
