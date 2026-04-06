import { Star, ThumbsUp, ThumbsDown, ShoppingCart, Zap, Award, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types for the actual DealerClaw review schema ───────────────────────────

interface ReviewSection {
  score?: number;
  summary?: string;
  highlights?: string[];
}

interface BuyerSuitability {
  bestFor?: string[];
  notFor?: string[];
}

interface FinalVerdict {
  rebeccaVerdict?: string;
  buyRecommendation?: boolean;
  oneLineSummary?: string;
}

// DealerClaw schema
interface DealerClawReview {
  overallScore?: number;
  exterior?: ReviewSection;
  interior?: ReviewSection;
  performance?: ReviewSection;
  efficiency?: ReviewSection;
  valueMoney?: ReviewSection;
  ownership?: ReviewSection;
  buyerSuitability?: BuyerSuitability;
  finalVerdict?: FinalVerdict;
  generatedAt?: string;
}

// Legacy EVEEVO schema (kept for backward compatibility)
interface LegacyReview {
  verdict?: string;
  rating?: number;
  summary?: string;
  range?: string;
  charging?: string;
  performance?: string;
  practicality?: string;
  technology?: string;
  value?: string;
  reliability?: string;
  running_costs?: string;
  best_for?: string[];
  not_for?: string[];
  buy_recommendation?: string;
}

interface RebeccaReviewPanelProps {
  rebeccaReview?: string | null;
  carTitle: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRating({ score, outOf = 10 }: { score: number; outOf?: number }) {
  // Normalise to 5 stars
  const normalised = (score / outOf) * 5;
  const full = Math.floor(normalised);
  const half = normalised - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
              ? "fill-amber-200 text-amber-400"
              : "text-muted-foreground/40"
          }`}
        />
      ))}
      <span className="text-xs font-semibold ml-1 text-muted-foreground">{score}/{outOf}</span>
    </div>
  );
}

const SECTION_META: { key: keyof DealerClawReview; label: string; emoji: string }[] = [
  { key: "exterior",    label: "Exterior",        emoji: "🚗" },
  { key: "interior",    label: "Interior",        emoji: "🪑" },
  { key: "performance", label: "Performance",     emoji: "🚀" },
  { key: "efficiency",  label: "Efficiency",      emoji: "⛽" },
  { key: "valueMoney",  label: "Value for Money", emoji: "💷" },
  { key: "ownership",   label: "Ownership",       emoji: "🔧" },
];

// ─── DealerClaw schema renderer ──────────────────────────────────────────────

function DealerClawPanel({ review, carTitle }: { review: DealerClawReview; carTitle: string }) {
  const sections = SECTION_META.filter(({ key }) => review[key]);
  const verdict = review.finalVerdict;
  const suitability = review.buyerSuitability;

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Rebecca's AI Review</p>
              <h3 className="text-white font-bold text-lg leading-tight">{carTitle}</h3>
            </div>
          </div>
          {review.overallScore !== undefined && (
            <div className="text-right">
              <div className="text-3xl font-black text-white leading-none">{review.overallScore}</div>
              <div className="text-white/70 text-xs">out of 10</div>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Overall star rating */}
        {review.overallScore !== undefined && (
          <div className="flex items-center gap-3">
            <StarRating score={review.overallScore} outOf={10} />
            <span className="text-sm text-muted-foreground">Overall Score</span>
          </div>
        )}

        {/* One-line summary / verdict quote */}
        {verdict?.rebeccaVerdict && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-900">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💬</span>
              <p className="font-semibold text-foreground italic leading-snug">"{verdict.rebeccaVerdict}"</p>
            </div>
          </div>
        )}

        {/* Section breakdown */}
        {sections.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Detailed Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections.map(({ key, label, emoji }) => {
                const sec = review[key] as ReviewSection;
                return (
                  <div key={key} className="bg-muted/40 rounded-xl p-4 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {emoji} {label}
                      </span>
                      {sec.score !== undefined && <StarRating score={sec.score} outOf={10} />}
                    </div>
                    {sec.summary && (
                      <p className="text-sm text-muted-foreground leading-snug">{sec.summary}</p>
                    )}
                    {sec.highlights && sec.highlights.length > 0 && (
                      <ul className="space-y-0.5 pt-1">
                        {sec.highlights.map((h, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Best For / Not For */}
        {(suitability?.bestFor?.length || suitability?.notFor?.length) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suitability?.bestFor && suitability.bestFor.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Best For</span>
                </div>
                <ul className="space-y-1">
                  {suitability.bestFor.map((item, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {suitability?.notFor && suitability.notFor.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">Not For</span>
                </div>
                <ul className="space-y-1">
                  {suitability.notFor.map((item, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Buy Recommendation */}
        {verdict?.buyRecommendation !== undefined && (
          <div className={`rounded-xl p-4 border flex items-start gap-3 ${
            verdict.buyRecommendation
              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              verdict.buyRecommendation
                ? "bg-green-100 dark:bg-green-900"
                : "bg-red-100 dark:bg-red-900"
            }`}>
              <ShoppingCart className={`w-4 h-4 ${
                verdict.buyRecommendation
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-600 dark:text-red-400"
              }`} />
            </div>
            <div>
              <p className={`text-sm font-semibold mb-0.5 ${
                verdict.buyRecommendation
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-700 dark:text-red-300"
              }`}>
                {verdict.buyRecommendation ? "Rebecca Recommends This Car ✓" : "Rebecca Does Not Recommend ✗"}
              </p>
              {verdict.oneLineSummary && (
                <p className={`text-sm ${
                  verdict.buyRecommendation
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {verdict.oneLineSummary}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Zap className="w-3 h-3 text-amber-500" />
          <span className="text-xs text-muted-foreground">Powered by DealerClaw AI · Rebecca</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Legacy schema renderer (unchanged) ──────────────────────────────────────

const LEGACY_SECTION_LABELS: Record<string, string> = {
  range: "⚡ Range",
  charging: "🔌 Charging",
  performance: "🚀 Performance",
  practicality: "🧳 Practicality",
  technology: "📱 Technology",
  value: "💷 Value for Money",
  reliability: "🔧 Reliability",
  running_costs: "💰 Running Costs",
};

function LegacyPanel({ review, carTitle }: { review: LegacyReview; carTitle: string }) {
  const sections = Object.entries(LEGACY_SECTION_LABELS).filter(
    ([key]) => review[key as keyof LegacyReview]
  );
  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800 overflow-hidden">
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
        {review.verdict && (
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-100 dark:border-purple-900">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div className="flex-1">
                <p className="font-semibold text-foreground italic">"{review.verdict}"</p>
                {review.rating !== undefined && (
                  <div className="mt-2">
                    <StarRating score={review.rating} outOf={10} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {review.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">{review.summary}</p>
        )}
        {sections.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sections.map(([key, label]) => (
              <div key={key} className="bg-muted/40 rounded-lg p-3 border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                <p className="text-sm text-foreground leading-snug">
                  {review[key as keyof LegacyReview] as string}
                </p>
              </div>
            ))}
          </div>
        )}
        {(review.best_for?.length || review.not_for?.length) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {review.best_for && review.best_for.length > 0 && (
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
            {review.not_for && review.not_for.length > 0 && (
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
        ) : null}
        {review.buy_recommendation && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShoppingCart className="w-4 h-4 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">Rebecca's Buy Verdict</p>
                <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">{review.buy_recommendation}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Zap className="w-3 h-3 text-purple-500" />
          <span className="text-xs text-muted-foreground">Powered by DealerClaw AI · Rebecca</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main export — auto-detects schema ───────────────────────────────────────

export default function RebeccaReviewPanel({ rebeccaReview, carTitle }: RebeccaReviewPanelProps) {
  if (!rebeccaReview) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = typeof rebeccaReview === "string" ? JSON.parse(rebeccaReview) : rebeccaReview;
  } catch {
    return null;
  }

  // Detect DealerClaw schema by presence of 'overallScore' or 'finalVerdict'
  if ("overallScore" in parsed || "finalVerdict" in parsed) {
    return <DealerClawPanel review={parsed as DealerClawReview} carTitle={carTitle} />;
  }

  // Fall back to legacy schema
  if ("verdict" in parsed || "rating" in parsed) {
    return <LegacyPanel review={parsed as LegacyReview} carTitle={carTitle} />;
  }

  return null;
}
