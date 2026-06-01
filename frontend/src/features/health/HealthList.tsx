import { Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useAnalysis, useDeleteHealth, useHealthList } from "./api";
import { STATUS_META, type Biomarker } from "./types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function HealthList() {
  const { data: analyses, isLoading } = useHealthList();
  const [openId, setOpenId] = useState<number | null>(null);

  if (isLoading) return <p className="text-sm text-muted">Загрузка…</p>;
  if ((analyses?.length ?? 0) === 0)
    return (
      <p className="text-sm text-muted">
        Анализов пока нет. Загрузите первый на вкладке «Загрузить».
      </p>
    );

  return (
    <div className="space-y-2">
      {analyses?.map((a) => (
        <button key={a.id} onClick={() => setOpenId(a.id)} className="w-full text-left">
          <Card className="flex items-center gap-3 hover:border-zinc-600">
            <div className="flex-1">
              <p className="text-sm font-medium">{a.source || "Анализ"}</p>
              <p className="mt-0.5 text-xs text-muted">
                {formatDate(a.date)} · {a.biomarker_count} показ.
              </p>
            </div>
            {a.abnormal_count > 0 ? (
              <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-400">
                {a.abnormal_count} вне нормы
              </span>
            ) : (
              <span className="rounded-full bg-nutrition/15 px-2.5 py-1 text-xs text-nutrition">
                в норме
              </span>
            )}
          </Card>
        </button>
      ))}

      {openId !== null && <AnalysisDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function AnalysisDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: analysis, isLoading } = useAnalysis(id);
  const del = useDeleteHealth();
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    await del.mutateAsync(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-bg p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{analysis?.source || "Анализ"}</h3>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading && <p className="text-sm text-muted">Загрузка…</p>}

        {analysis && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{formatDate(analysis.date)}</p>

            <div className="space-y-2">
              {analysis.biomarkers.map((b) => (
                <BiomarkerRow key={b.id} b={b} />
              ))}
            </div>

            {confirm ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500 text-red-400"
                  onClick={handleDelete}
                  disabled={del.isPending}
                >
                  Подтвердить удаление
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>
                  Отмена
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full text-red-400" onClick={() => setConfirm(true)}>
                <Trash2 className="h-4 w-4" /> Удалить анализ
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BiomarkerRow({ b }: { b: Biomarker }) {
  const meta = STATUS_META[b.status];
  const ref =
    b.reference_min != null || b.reference_max != null
      ? `${b.reference_min ?? "—"}–${b.reference_max ?? "—"}`
      : null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} />
      <div className="flex-1">
        <p className="text-sm font-medium">{b.name}</p>
        {ref && <p className="text-xs text-muted">Реф.: {ref}{b.unit ? ` ${b.unit}` : ""}</p>}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">
          {b.value}
          {b.unit ? ` ${b.unit}` : ""}
        </p>
        <p className="text-xs text-muted">{meta.label}</p>
      </div>
    </div>
  );
}
