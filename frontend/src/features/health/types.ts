export type BiomarkerStatus = "normal" | "high" | "low";

export interface BiomarkerIn {
  name: string;
  value: number;
  unit?: string | null;
  reference_min?: number | null;
  reference_max?: number | null;
}

export interface Biomarker extends BiomarkerIn {
  id: number;
  status: BiomarkerStatus;
}

export interface HealthCreate {
  date: string;
  source?: string | null;
  biomarkers: BiomarkerIn[];
}

export interface HealthAnalysis {
  id: number;
  date: string;
  source: string | null;
  biomarkers: Biomarker[];
}

export interface HealthListItem {
  id: number;
  date: string;
  source: string | null;
  biomarker_count: number;
  abnormal_count: number;
}

export interface RecognizeResult {
  biomarkers: BiomarkerIn[];
  note: string;
}

export const STATUS_META: Record<BiomarkerStatus, { dot: string; label: string }> = {
  normal: { dot: "bg-nutrition", label: "Норма" },
  high: { dot: "bg-red-500", label: "Выше нормы" },
  low: { dot: "bg-health", label: "Ниже нормы" },
};
