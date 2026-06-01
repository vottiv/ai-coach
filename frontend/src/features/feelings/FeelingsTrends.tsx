import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";

import { useSubjectiveRange } from "./api";
import type { SubjectiveLog } from "./types";

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function shortLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

interface Point {
  name: string;
  mood?: number;
  energy?: number;
  sleep?: number;
  stress?: number;
  weight?: number;
}

function buildPoints(logs: SubjectiveLog[]): Point[] {
  const byDate = new Map<string, { morning?: SubjectiveLog; evening?: SubjectiveLog }>();
  for (const log of logs) {
    const entry = byDate.get(log.date) ?? {};
    entry[log.slot] = log;
    byDate.set(log.date, entry);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { morning, evening }]) => ({
      name: shortLabel(date),
      mood: evening?.mood ?? morning?.mood ?? undefined,
      energy: evening?.energy ?? morning?.energy ?? undefined,
      sleep: morning?.sleep_quality ?? undefined,
      stress: evening?.stress ?? undefined,
      weight: morning?.body_weight ?? undefined,
    }));
}

const tooltipStyle = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 12,
  fontSize: 12,
};

export function FeelingsTrends() {
  const { data, isLoading } = useSubjectiveRange(daysAgoIso(29), todayIso());
  const points = buildPoints(data ?? []);
  const weightPoints = points.filter((p) => p.weight != null);

  if (isLoading) return <p className="text-sm text-muted">Загрузка…</p>;
  if (points.length === 0)
    return (
      <p className="text-sm text-muted">
        Пока нет данных. Заполните анкеты — графики появятся здесь.
      </p>
    );

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="font-medium">Самочувствие (1–5)</h2>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#3f3f46" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#3f3f46" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#a1a1aa" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="mood" name="Настроение" stroke="#8B5CF6" strokeWidth={2} connectNulls dot={false} />
              <Line type="monotone" dataKey="energy" name="Энергия" stroke="#F97316" strokeWidth={2} connectNulls dot={false} />
              <Line type="monotone" dataKey="sleep" name="Сон" stroke="#3B82F6" strokeWidth={2} connectNulls dot={false} />
              <Line type="monotone" dataKey="stress" name="Стресс" stroke="#EF4444" strokeWidth={2} connectNulls dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {weightPoints.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-medium">Вес тела, кг</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightPoints} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#3f3f46" />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#3f3f46" width={48} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#a1a1aa" }} formatter={(v: number) => [`${v} кг`, "Вес"]} />
                <Line type="monotone" dataKey="weight" name="Вес" stroke="#22C55E" strokeWidth={2} connectNulls dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
