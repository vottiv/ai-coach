import { Pencil, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useDeleteMeasurement } from "./api";
import type { BodyMeasurement } from "./types";

const FIELDS = [
  { key: "weight", label: "Вес", unit: "кг" },
  { key: "bicep_left", label: "Биц.Л", unit: "см" },
  { key: "bicep_right", label: "Биц.П", unit: "см" },
  { key: "shoulders", label: "Плечи", unit: "см" },
  { key: "chest", label: "Грудь", unit: "см" },
  { key: "waist", label: "Талия", unit: "см" },
  { key: "glutes", label: "Ягодицы", unit: "см" },
  { key: "hips_left", label: "Бед.Л", unit: "см" },
  { key: "hips_right", label: "Бед.П", unit: "см" },
  { key: "calves_left", label: "Икры.Л", unit: "см" },
  { key: "calves_right", label: "Икры.П", unit: "см" },
] as const;

interface Props {
  measurements: BodyMeasurement[];
  onEdit: (m: BodyMeasurement) => void;
}

export function MeasurementHistoryTab({ measurements, onEdit }: Props) {
  const deleteMut = useDeleteMeasurement();

  async function handleDelete(id: number) {
    await deleteMut.mutateAsync(id);
  }

  if (measurements.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-muted">Нет замеров</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {measurements.map((m) => {
        const dateStr = new Date(m.measured_at).toLocaleDateString("ru-RU", {
          day: "numeric", month: "short", year: "numeric",
        });

        const filled = FIELDS.filter((f) => m[f.key] != null);
        if (filled.length === 0) return null;

        return (
          <Card key={m.id} className="gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{dateStr}</p>
              <div className="flex gap-1">
                <button onClick={() => onEdit(m)} className="rounded-lg p-1.5 text-muted hover:text-zinc-200">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(m.id)} className="rounded-lg p-1.5 text-muted hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {filled.map((f) => (
                <span key={f.key}>
                  {f.label}: {m[f.key]} {f.unit}
                </span>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}