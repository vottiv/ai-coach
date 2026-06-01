import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { useCalendar } from "./api";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

interface Props {
  year: number;
  month: number; // 1..12
  selected: string | null;
  onChangeMonth: (year: number, month: number) => void;
  onSelectDay: (date: string | null) => void;
}

export function Calendar({ year, month, selected, onChangeMonth, onSelectDay }: Props) {
  const { data } = useCalendar(year, month);
  const counts = new Map((data?.days ?? []).map((d) => [d.date, d.count]));

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7; // понедельник = 0

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () =>
    month === 1 ? onChangeMonth(year - 1, 12) : onChangeMonth(year, month - 1);
  const next = () =>
    month === 12 ? onChangeMonth(year + 1, 1) : onChangeMonth(year, month + 1);

  const iso = (day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prev} className="rounded-xl p-1.5 hover:bg-bg">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-medium">
          {MONTHS[month - 1]} {year}
        </p>
        <button onClick={next} className="rounded-xl p-1.5 hover:bg-bg">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 text-xs text-muted">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const dateStr = iso(day);
          const count = counts.get(dateStr) ?? 0;
          const isSelected = selected === dateStr;
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDay(isSelected ? null : dateStr)}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-xl text-sm",
                isSelected ? "bg-workouts text-white" : "hover:bg-bg",
                count > 0 && !isSelected && "font-semibold text-workouts",
              )}
            >
              {day}
              {count > 0 && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
                    isSelected ? "bg-white" : "bg-workouts",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex justify-between border-t border-border pt-3 text-xs text-muted">
        <span>За месяц: {data?.month_total ?? 0}</span>
        <span>За год: {data?.year_total ?? 0}</span>
      </div>
    </div>
  );
}
