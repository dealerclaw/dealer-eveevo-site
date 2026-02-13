import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CreditScoreGaugeProps {
  score: number; // 0-850
  className?: string;
}

// Credit score ranges and colors
const getScoreInfo = (score: number) => {
  if (score >= 800) {
    return {
      rating: "Excellent",
      color: "#22c55e", // green-500
      bgColor: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-700 dark:text-green-300",
      description: "You have an excellent credit score! You'll qualify for the best rates.",
    };
  } else if (score >= 740) {
    return {
      rating: "Very Good",
      color: "#84cc16", // lime-500
      bgColor: "bg-lime-50 dark:bg-lime-950",
      textColor: "text-lime-700 dark:text-lime-300",
      description: "Your credit score is very good. You'll get competitive rates.",
    };
  } else if (score >= 670) {
    return {
      rating: "Good",
      color: "#eab308", // yellow-500
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      textColor: "text-yellow-700 dark:text-yellow-300",
      description: "You have a good credit score. Most lenders will approve you.",
    };
  } else if (score >= 580) {
    return {
      rating: "Fair",
      color: "#f97316", // orange-500
      bgColor: "bg-orange-50 dark:bg-orange-950",
      textColor: "text-orange-700 dark:text-orange-300",
      description: "Your credit score is fair. You may face higher interest rates.",
    };
  } else {
    return {
      rating: "Poor",
      color: "#ef4444", // red-500
      bgColor: "bg-red-50 dark:bg-red-950",
      textColor: "text-red-700 dark:text-red-300",
      description: "Your credit score needs improvement. Consider credit repair options.",
    };
  }
};

export default function CreditScoreGauge({ score, className = "" }: CreditScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const scoreInfo = getScoreInfo(score);
  
  // Animate score counting up
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = score / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Calculate gauge rotation (semi-circle: -90deg to 90deg)
  // Score range 300-850, map to -90 to 90 degrees
  const minScore = 300;
  const maxScore = 850;
  const normalizedScore = Math.max(minScore, Math.min(maxScore, animatedScore));
  const rotation = -90 + ((normalizedScore - minScore) / (maxScore - minScore)) * 180;

  return (
    <Card className={`${scoreInfo.bgColor} border-2 ${className}`}>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Your Credit Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 pt-4">
        {/* Gauge Container */}
        <div className="relative w-64 h-32">
          {/* Background semi-circle */}
          <svg className="w-full h-full" viewBox="0 0 200 100">
            {/* Background arc */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="20"
              strokeLinecap="round"
            />
            
            {/* Colored arc (animated) */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke={scoreInfo.color}
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * ((normalizedScore - minScore) / (maxScore - minScore)))}
              style={{
                transition: "stroke-dashoffset 2s ease-out",
              }}
            />

            {/* Needle */}
            <g transform={`rotate(${rotation} 100 90)`}>
              <line
                x1="100"
                y1="90"
                x2="100"
                y2="30"
                stroke="#374151"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="90" r="6" fill="#374151" />
            </g>

            {/* Score markers */}
            <text x="15" y="95" fontSize="10" fill="#9ca3af">300</text>
            <text x="175" y="95" fontSize="10" fill="#9ca3af">850</text>
          </svg>

          {/* Score display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <div className={`text-5xl font-bold ${scoreInfo.textColor}`}>
              {animatedScore}
            </div>
          </div>
        </div>

        {/* Rating badge */}
        <div className={`px-6 py-2 rounded-full ${scoreInfo.bgColor} border-2`} style={{ borderColor: scoreInfo.color }}>
          <span className={`text-xl font-bold ${scoreInfo.textColor}`}>
            {scoreInfo.rating}
          </span>
        </div>

        {/* Description */}
        <p className="text-center text-sm text-muted-foreground max-w-md">
          {scoreInfo.description}
        </p>

        {/* Score breakdown */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Very Good</span>
            <span>Excellent</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="flex-1 bg-red-500" />
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-yellow-500" />
            <div className="flex-1 bg-lime-500" />
            <div className="flex-1 bg-green-500" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>300-579</span>
            <span>580-669</span>
            <span>670-739</span>
            <span>740-799</span>
            <span>800-850</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
