import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee, Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Orange top area */}
      <div className="bg-gradient-to-b from-orange-500 to-orange-400 flex flex-col items-center justify-center gap-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-12 px-6">
        <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6">
          <Mail className="h-14 w-14 text-white" />
        </div>
        <div className="text-center text-white space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
          <p className="text-orange-100 text-sm leading-relaxed max-w-xs mx-auto">
            We&apos;ve sent you a verification link. Click it to activate your account.
          </p>
        </div>
      </div>

      {/* Bottom content */}
      <div className="flex-1 flex flex-col justify-between px-6 py-10">
        <div className="bg-muted/50 rounded-2xl p-4 border">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Didn&apos;t receive the email? Check your spam folder or try signing up again with the correct address.
          </p>
        </div>

        <div className="flex flex-col gap-3 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <Button
            className="w-full min-h-[52px] text-base font-semibold active:scale-[0.98] transition-transform"
            asChild
          >
            <Link href="/auth/signin">
              <Coffee className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full min-h-[48px] active:scale-[0.98] transition-transform"
            asChild
          >
            <Link href="/auth/signup">Try signing up again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
