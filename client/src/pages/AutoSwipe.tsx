import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, ArrowRight } from "lucide-react";

export default function AutoSwipe() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="container max-w-lg text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">AutoSwipe</h1>
          <p className="text-muted-foreground mb-2 text-lg">Coming soon.</p>
          <p className="text-muted-foreground text-sm mb-8">
            AutoSwipe lets buyers swipe through dealer stock and submit interest in seconds. Available for dealers using DealerClaw.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/dealerclaw-cars">
                Browse DealerClaw Cars
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/for-dealers">Learn about DealerClaw</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
