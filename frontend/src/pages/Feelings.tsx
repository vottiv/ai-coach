import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { FeelingsToday } from "@/features/feelings/FeelingsToday";
import { FeelingsTrends } from "@/features/feelings/FeelingsTrends";
import { cn } from "@/lib/utils";

type Tab = "today" | "trends";

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "Анкеты" },
  { key: "trends", label: "Динамика" },
];

export function Feelings() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div>
      <PageHeader title="Ощущения" subtitle="Дважды в день — состояние за 20 секунд" />

      <div className="mb-5 flex gap-1 rounded-2xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-feelings text-white" : "text-muted hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" && <FeelingsToday />}
      {tab === "trends" && <FeelingsTrends />}
    </div>
  );
}
