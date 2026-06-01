import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { HealthList } from "@/features/health/HealthList";
import { HealthUploadForm } from "@/features/health/HealthUploadForm";
import { cn } from "@/lib/utils";

type Tab = "list" | "upload";

const TABS: { key: Tab; label: string }[] = [
  { key: "list", label: "Анализы" },
  { key: "upload", label: "Загрузить" },
];

export function Health() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("list");

  return (
    <div>
      <header className="mb-5 flex items-center gap-3">
        <button onClick={() => navigate("/profile")} className="rounded-xl p-1.5 hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Анализы</h1>
          <p className="mt-1 text-sm text-muted">Биомаркеры, референсы и статусы</p>
        </div>
      </header>

      <div className="mb-5 flex gap-1 rounded-2xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-health text-white" : "text-muted hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" && <HealthList />}
      {tab === "upload" && <HealthUploadForm onSaved={() => setTab("list")} />}
    </div>
  );
}
