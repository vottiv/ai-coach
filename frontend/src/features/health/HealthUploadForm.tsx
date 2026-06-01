import { Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useCreateHealth, useRecognizeHealth } from "./api";
import type { BiomarkerIn } from "./types";

const todayIso = () => new Date().toISOString().slice(0, 10);
const emptyBiomarker = (): BiomarkerIn => ({
  name: "",
  value: 0,
  unit: "",
  reference_min: null,
  reference_max: null,
});

export function HealthUploadForm({ onSaved }: { onSaved: () => void }) {
  const [date, setDate] = useState(todayIso());
  const [source, setSource] = useState("");
  const [biomarkers, setBiomarkers] = useState<BiomarkerIn[]>([emptyBiomarker()]);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = useCreateHealth();
  const recognize = useRecognizeHealth();

  const update = (i: number, field: keyof BiomarkerIn, value: string) =>
    setBiomarkers((prev) =>
      prev.map((b, j) => {
        if (j !== i) return b;
        if (field === "name" || field === "unit") return { ...b, [field]: value };
        return { ...b, [field]: value === "" ? null : Number(value) };
      }),
    );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await recognize.mutateAsync(file);
    setNote(result.note);
    if (result.biomarkers.length) {
      setBiomarkers((prev) => [
        ...prev.filter((b) => b.name.trim()),
        ...result.biomarkers,
      ]);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const valid = biomarkers.filter((b) => b.name.trim());

  const save = async () => {
    await create.mutateAsync({
      date,
      source: source.trim() || null,
      biomarkers: valid.map((b) => ({
        ...b,
        value: Number(b.value) || 0,
        unit: b.unit?.trim() || null,
      })),
    });
    setBiomarkers([emptyBiomarker()]);
    setSource("");
    setNote(null);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Дата анализа</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-health"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Лаборатория / источник</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="например, Гемотест"
            className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-health"
          />
        </div>
      </Card>

      <Card className="space-y-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 text-left"
          disabled={recognize.isPending}
        >
          <span className="rounded-2xl bg-bg p-2.5 text-health">
            <Upload className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {recognize.isPending ? "Распознаём…" : "Загрузить анализы (PDF/фото)"}
            </p>
            <p className="text-xs text-muted">Авто-извлечение биомаркеров (или вручную)</p>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
        {note && <p className="text-xs text-amber-400">{note}</p>}
      </Card>

      {biomarkers.map((b, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={b.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Биомаркер (напр. Гемоглобин)"
              className="h-10 flex-1 rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-health"
            />
            {biomarkers.length > 1 && (
              <button
                onClick={() => setBiomarkers((prev) => prev.filter((_, j) => j !== i))}
                className="p-1 text-muted hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Значение" value={b.value} onChange={(v) => update(i, "value", v)} />
            <TextField label="Единица" value={b.unit ?? ""} onChange={(v) => update(i, "unit", v)} />
            <Field label="Реф. мин" value={b.reference_min} onChange={(v) => update(i, "reference_min", v)} />
            <Field label="Реф. макс" value={b.reference_max} onChange={(v) => update(i, "reference_max", v)} />
          </div>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={() => setBiomarkers((prev) => [...prev, emptyBiomarker()])}>
        <Plus className="h-4 w-4" /> Добавить биомаркер
      </Button>

      <Button
        className="w-full bg-health text-white hover:bg-health/90"
        size="lg"
        onClick={save}
        disabled={valid.length === 0 || create.isPending}
      >
        {create.isPending ? "Сохранение…" : "Сохранить анализ"}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-health"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="г/л"
        className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-health"
      />
    </div>
  );
}
