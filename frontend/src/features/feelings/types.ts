export type Slot = "morning" | "evening";

export type MetricKey =
  | "sleep_quality"
  | "energy"
  | "mood"
  | "soreness"
  | "motivation"
  | "stress"
  | "fatigue"
  | "satisfaction";

export interface SubjectiveLog {
  id: number;
  date: string;
  slot: Slot;
  sleep_quality: number | null;
  energy: number | null;
  mood: number | null;
  soreness: number | null;
  motivation: number | null;
  stress: number | null;
  fatigue: number | null;
  satisfaction: number | null;
  body_weight: number | null;
  notes: string | null;
}

export interface SubjectiveIn {
  date: string;
  slot: Slot;
  sleep_quality?: number | null;
  energy?: number | null;
  mood?: number | null;
  soreness?: number | null;
  motivation?: number | null;
  stress?: number | null;
  fatigue?: number | null;
  satisfaction?: number | null;
  body_weight?: number | null;
  notes?: string | null;
}

export interface TodayOut {
  date: string;
  morning: SubjectiveLog | null;
  evening: SubjectiveLog | null;
}

export const MORNING_QUESTIONS: { key: MetricKey; label: string }[] = [
  { key: "sleep_quality", label: "Качество сна" },
  { key: "energy", label: "Энергия при подъёме" },
  { key: "mood", label: "Настроение" },
  { key: "soreness", label: "Комфорт тела" },
  { key: "motivation", label: "Мотивация" },
];

export const EVENING_QUESTIONS: { key: MetricKey; label: string }[] = [
  { key: "energy", label: "Энергия за день" },
  { key: "stress", label: "Спокойствие" },
  { key: "mood", label: "Настроение" },
  { key: "fatigue", label: "Бодрость" },
  { key: "satisfaction", label: "Удовлетворённость днём" },
];

export const SLOT_LABEL: Record<Slot, string> = {
  morning: "Утро",
  evening: "Вечер",
};
