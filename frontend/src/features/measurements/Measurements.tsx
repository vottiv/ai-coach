import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMeasurements } from "./api";
import type { BodyMeasurement } from "./types";
import { LatestMeasurementCard } from "./LatestMeasurementCard";
import { MeasurementHistoryTab } from "./MeasurementHistoryTab";
import { MeasurementDialog } from "./MeasurementDialog";
import { BodyAssessment } from "./BodyAssessment";
import { cn } from "@/lib/utils";

type Tab = "current" | "history";

const TABS: { key: Tab; label: string }[] = [
  { key: "current", label: "Текущий замер" },
  { key: "history", label: "История" },
];

export function Measurements() {
  const { data, isLoading } = useMeasurements();
  const [tab, setTab] = useState<Tab>("current");
  const [showForm, setShowForm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null);

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-2xl border border-border bg-surface" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Замеры тела</h2>
          <Button onClick={() => setShowForm(true)} className="h-8 px-3 text-sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Добавить
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">Нет замеров</p>
          <p className="mt-1 text-xs text-muted">Добавьте первый замер, чтобы отслеживать изменения</p>
        </div>
        <MeasurementDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          measurement={null}
        />
      </div>
    );
  }

  const latest = data[0];
  const previous = data.length > 1 ? data[1] : undefined;
  const history = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Замеры тела</h2>
        <Button onClick={() => setShowForm(true)} className="h-8 px-3 text-sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Добавить
        </Button>
      </div>

      <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-workouts text-white" : "text-muted hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "current" && (
        <div className="space-y-4">
          <LatestMeasurementCard measurement={latest} previous={previous} />
          <BodyAssessment />
        </div>
      )}

      {tab === "history" && (
        <MeasurementHistoryTab
          measurements={history}
          onEdit={(m) => setEditingMeasurement(m)}
        />
      )}

      <MeasurementDialog
        open={showForm || editingMeasurement !== null}
        onClose={() => {
          setShowForm(false);
          setEditingMeasurement(null);
        }}
        measurement={editingMeasurement}
      />
    </div>
  );
}