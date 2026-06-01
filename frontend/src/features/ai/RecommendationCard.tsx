import { CheckCircle2, Info, Sparkles, TriangleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useRecommendation } from "./api";
import type { InsightCategory, InsightSeverity } from "./types";

const CATEGORY_STYLE: Record<InsightCategory, { text: string; bg: string; border: string }> = {
  workouts: {
    text: "text-workouts",
    bg: "bg-workouts/10",
    border: "border-workouts/30",
  },
  nutrition: {
    text: "text-nutrition",
    bg: "bg-nutrition/10",
    border: "border-nutrition/30",
  },
  feelings: {
    text: "text-feelings",
    bg: "bg-feelings/10",
    border: "border-feelings/30",
  },
  health: {
    text: "text-health",
    bg: "bg-health/10",
    border: "border-health/30",
  },
  general: {
    text: "text-zinc-300",
    bg: "bg-zinc-800/60",
    border: "border-zinc-700/50",
  },
};

const SEVERITY_ICON: Record<InsightSeverity, typeof Sparkles> = {
  info: Info,
  warning: TriangleAlert,
  success: CheckCircle2,
};

export function RecommendationCard() {
  const { data, isLoading } = useRecommendation();

  if (isLoading) {
    return (
      <div className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
    );
  }

  if (!data) return null;

  const { recommendation, ai_powered } = data;
  const style = CATEGORY_STYLE[recommendation.category] ?? CATEGORY_STYLE.general;
  const SeverityIcon = SEVERITY_ICON[recommendation.severity] ?? Info;

  return (
    <Card className={cn("border", style.border, style.bg, "gap-3")}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 shrink-0 rounded-xl p-2", style.bg, style.text)}>
          <SeverityIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn("text-sm font-semibold leading-tight", style.text)}>
              {recommendation.title}
            </p>
            {ai_powered && (
              <span className="shrink-0 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-muted">
                AI
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{recommendation.body}</p>
        </div>
      </div>
    </Card>
  );
}
