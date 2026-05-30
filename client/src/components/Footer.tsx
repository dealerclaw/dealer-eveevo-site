import { Link } from "wouter";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white/80 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-[#9BCB90]" />
              <span className="font-bold text-white text-lg">EVEEVO</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Smart. Easy. Electric. EVEEVO is an EV-first smart car marketplace helping buyers find electric and lower-running-cost cars.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-3">Browse Cars</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/browse" className="hover:text-white transition-colors">Electric Cars</Link></li>
              <li><Link href="/browse?fuelType=Hybrid" className="hover:text-white transition-colors">Hybrid Cars</Link></li>
              <li><Link href="/dealerclaw-cars" className="hover:text-white transition-colors">DealerClaw Cars</Link></li>
              <li><Link href="/lifestyle-search" className="hover:text-white transition-colors">Lifestyle Search</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare Running Costs</Link></li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-3">Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/autoswipe" className="hover:text-white transition-colors">AutoSwipe</Link></li>
              <li><Link href="/finance" className="hover:text-white transition-colors">Finance Calculator</Link></li>
              <li><Link href="/ev-specs/1" className="hover:text-white transition-colors">EV Specs</Link></li>
            </ul>
          </div>

          {/* Dealers */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-3">Dealers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/for-dealers" className="hover:text-white transition-colors">For Dealers</Link></li>
              <li><Link href="/dealerclaw-cars" className="hover:text-white transition-colors">DealerClaw</Link></li>
              <li><Link href="/become-a-dealer" className="hover:text-white transition-colors">Become a Dealer</Link></li>
              <li><Link href="/dealer/dashboard" className="hover:text-white transition-colors">Dealer Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} EVEEVO. All rights reserved.</p>
          <p>DealerClaw Cars are dealer-promoted stock and are not part of EVEEVO's core electric car recommendations.</p>
        </div>
      </div>
    </footer>
  );
}
