import { HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";

import { useToday } from "./api";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function FeelingsHintCard() {
  const navigate = useNavigate();
  const { data } = useToday(todayIso());
  const isMorning = new Date().getHours() < 14;
  const done = isMorning ? !!data?.morning : !!data?.evening;

  if (done) return null;

  return (
    <button onClick={() => navigate("/feelings")} className="block w-full text-left">
      <Card className="flex items-center gap-3 hover:border-zinc-600">
        <span className="rounded-2xl bg-bg p-2.5 text-feelings">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isMorning ? "Утренняя анкета" : "Вечерняя анкета"}
          </p>
          <p className="mt-0.5 text-xs text-muted">Отметьте состояние — это займёт ~20 секунд</p>
        </div>
      </Card>
    </button>
  );
}
