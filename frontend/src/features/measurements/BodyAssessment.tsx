import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useBodyAssessment } from "./api";

export function BodyAssessment() {
  const { data, isLoading } = useBodyAssessment();

  if (isLoading) {
    return (
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-feelings" />
          <h3 className="text-sm font-medium">Оценка состояния</h3>
        </div>
        <div className="h-12 animate-pulse rounded-xl bg-bg" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-ai" />
        <h3 className="text-sm font-medium">
          Оценка состояния
          {data.ai_powered && <span className="ml-1.5 text-[10px] text-muted">AI</span>}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-muted">{data.assessment}</p>
    </Card>
  );
}