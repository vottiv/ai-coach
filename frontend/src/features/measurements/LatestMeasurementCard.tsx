import { TrendingUp, TrendingDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BodyMeasurement } from "./types";

const FIELDS = [
  { key: "weight", label: "Вес", unit: "кг" },
  { key: "bicep_left", label: "Бицепс Л", unit: "см" },
  { key: "bicep_right", label: "Бицепс П", unit: "см" },
  { key: "shoulders", label: "Плечи", unit: "см" },
  { key: "chest", label: "Грудь", unit: "см" },
  { key: "waist", label: "Талия", unit: "см" },
  { key: "glutes", label: "Ягодицы", unit: "см" },
  { key: "hips_left", label: "Бедро Л", unit: "см" },
  { key: "hips_right", label: "Бедро П", unit: "см" },
  { key: "calves_left", label: "Икра Л", unit: "см" },
  { key: "calves_right", label: "Икра П", unit: "см" },
] as const;

interface Props {
  measurement: BodyMeasurement;
  previous?: BodyMeasurement;
}

export function LatestMeasurementCard({ measurement, previous }: Props) {
  const dateStr = new Date(measurement.measured_at).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Последний замер: {dateStr}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {FIELDS.map((f) => {
          const value = measurement[f.key];
          if (value == null) return null;

          const prevValue = previous?.[f.key];
          const diff = prevValue != null ? value - prevValue : null;
          const isPositive = diff != null && diff > 0;
          const isNegative = diff != null && diff < 0;
          const diffStr = diff != null ? `${isPositive ? "+" : ""}${diff.toFixed(1)}` : null;

          return (
            <div key={f.key} className="flex items-baseline justify-between rounded-xl bg-bg px-3 py-2">
              <span className="text-muted">{f.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{value} {f.unit}</span>
                {diffStr && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-xs",
                    isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-muted"
                  )}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(diff!).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}