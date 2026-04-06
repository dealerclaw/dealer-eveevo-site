import { Star, ThumbsUp, ThumbsDown, ShoppingCart, Zap, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RebeccaReview {
  verdict: string;
  rating: number; // out of 10
  summary: string;
  range?: string;
  charging?: string;
  performance?: string;
  practicality?: string;
  technology?: string;
  value?: string;
  reliability?: string;
  running_costs?: string;
  best_for: string[];
  not_for: string[];
  buy_recommendation: string;
  buy_cta?: string;
}

interface RebeccaReviewPanelProps {
  rebeccaReview?: string | null;
  carTitle: string;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating / 2);
  const half = rating % 2 >= 1;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
              ? "fill-amber-200 text-amber-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
      <span className="text-sm font-semibold ml-1">{rating}/10</span>
    </div>
  );
}

const SECTION_LABELS: Record<string, string> = {
  range: "⚡ Range",
  charging: "🔌 Charging",
  performance: "🚀 Performance",
  practicality: "🧳 Practicality",
  technology: "📱 Technology",
  value: "💷 Value for Money",
  reliability: "🔧 Reliability",
  running_costs: "💰 Running Costs",
};

export default function RebeccaReviewPanel({ rebeccaReview, carTitle }: RebeccaReviewPanelProps) {
  if (!rebeccaReview) return null;

  let review: RebeccaReview;
  try {
    review = typeof rebeccaReview === "string" ? JSON.parse(rebeccaReview) : rebeccaReview;
  } catch {
    return null;
  }

  if (!review?.verdict) return null;

  const sections = Object.entries(SECTION_LABELS).filter(
    ([key]) => review[key as keyof RebeccaReview]
  );

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Rebecca's Review</p>
            <h3 className="text-white font-bold text-lg leading-tight">{carTitle}</h3>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Verdict Banner */}
        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-100 dark:border-purple-900">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground italic">"{review.verdict}"</p>
              <div className="mt-2">
                <StarRating rating={review.rating} />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {review.summary && (
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{review.summary}</p>
          </div>
        )}

        {/* 9-Section Grid */}
        {sections.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Detailed Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sections.map(([key, label]) => (
                <div
                  key={key}
                  className="bg-muted/40 rounded-lg p-3 border border-border/50"
                >
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm text-foreground leading-snug">
                    {review[key as keyof RebeccaReview] as string}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best For / Not For */}
        {(review.best_for?.length > 0 || review.not_for?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {review.best_for?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Best For</span>
                </div>
                <ul className="space-y-1">
                  {review.best_for.map((item, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {review.not_for?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">Not For</span>
                </div>
                <ul className="space-y-1">
                  {review.not_for.map((item, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Buy Recommendation Card */}
        {review.buy_recommendation && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShoppingCart className="w-4 h-4 text-green-700 dark:text-green-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                  Rebecca's Buy Verdict
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                  {review.buy_recommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Powered by badge */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Zap className="w-3 h-3 text-purple-500" />
          <span className="text-xs text-muted-foreground">Powered by DealerClaw AI · Rebecca</span>
        </div>
      </CardContent>
    </Card>
  );
}
