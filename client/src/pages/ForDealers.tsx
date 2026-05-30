import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap, Share2, Instagram, TrendingUp, MessageCircle,
  CheckCircle, ArrowRight, Car, Users, BarChart3,
} from "lucide-react";

const BENEFITS = [
  { icon: Car, text: "Sync your stock automatically" },
  { icon: Zap, text: "Generate AI social posts for every vehicle" },
  { icon: Share2, text: "Create Facebook, Instagram and TikTok-ready content" },
  { icon: TrendingUp, text: "Build AutoSwipe links for buyer engagement" },
  { icon: CheckCircle, text: "Promote EVs, hybrids, petrol and diesel stock" },
  { icon: Users, text: "Get visibility on EVEEVO through DealerClaw Cars" },
  { icon: MessageCircle, text: "Capture leads through enquiry, WhatsApp and AutoSwipe" },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Connect your stock", desc: "Link your DMS or upload your inventory. DealerClaw reads your stock automatically." },
  { step: 2, title: "DealerClaw creates AI vehicle profiles", desc: "Each car gets a smart buyer-facing profile with specs, highlights and positioning." },
  { step: 3, title: "Generate social posts and buyer hooks", desc: "DealerClaw writes and schedules posts for Facebook, Instagram and TikTok — no manual effort." },
  { step: 4, title: "Your cars appear as DealerClaw Cars on EVEEVO", desc: "Your stock gets visibility to EVEEVO's buyer audience alongside EV alternatives." },
  { step: 5, title: "Buyers click AutoSwipe, WhatsApp or enquiry", desc: "Buyers engage directly through swipe, message or enquiry — all tracked." },
  { step: 6, title: "Leads go back to your dealership", desc: "Every lead, click and enquiry is delivered directly to you in real time." },
];

export default function ForDealers() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#1a1a2e] text-white py-20">
          <div className="container max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Zap className="w-4 h-4 text-[#9BCB90]" />
              <span>For Car Dealers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
              DealerClaw — the AI stock-selling agent for car dealers.
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl">
              Turn your stock into social posts, AutoSwipe links, AI adverts and EVEEVO buyer pages — without manually posting every car every day.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-[#9BCB90] text-[#1a1a2e] hover:bg-[#8aba7f] font-bold">
                Book a DealerClaw Demo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Start DealerClaw Trial
              </Button>
              <Button size="lg" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
                <Link href="/dealerclaw-cars">See Example DealerClaw Cars</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-background">
          <div className="container max-w-4xl">
            <h2 className="text-2xl font-bold mb-2 text-center">Everything you need to sell more cars</h2>
            <p className="text-muted-foreground text-center mb-10">DealerClaw handles the content, the visibility and the leads — you focus on selling.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-muted/40 border-y">
          <div className="container max-w-3xl">
            <h2 className="text-2xl font-bold mb-2 text-center">How DealerClaw works</h2>
            <p className="text-muted-foreground text-center mb-10">Six steps from stock to sold.</p>
            <div className="space-y-4">
              {HOW_IT_WORKS.map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why DealerClaw Cars appear on EVEEVO */}
        <section className="py-16 bg-background">
          <div className="container max-w-3xl">
            <div className="bg-[#1a1a2e] text-white rounded-2xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-4">Why DealerClaw Cars appear on EVEEVO</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                EVEEVO is EV-first, but buyers are at different stages. DealerClaw Cars gives your wider stock visibility while helping buyers compare petrol, diesel, hybrid and electric options in one place.
              </p>
              <p className="text-white/80 leading-relaxed">
                Your cars reach buyers who are researching their next vehicle — whether they are ready to go electric today or need a practical option first. Either way, your stock is in front of them.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Button className="bg-[#9BCB90] text-[#1a1a2e] hover:bg-[#8aba7f] font-bold">
                  Book a DealerClaw Demo
                </Button>
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10" asChild>
                  <Link href="/dealerclaw-cars">See DealerClaw Cars</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats / social proof placeholder */}
        <section className="py-12 bg-muted/40 border-t">
          <div className="container max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "54,000+", label: "Vehicles on EVEEVO" },
                { value: "AI-powered", label: "Stock profiles" },
                { value: "Multi-channel", label: "Social distribution" },
                { value: "Real-time", label: "Lead delivery" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-primary">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
