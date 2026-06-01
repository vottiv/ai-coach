import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MODULE_META, type ModuleKey } from "@/config/modules";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore, type User } from "@/store/auth";

const GOALS = [
  { id: "mass", label: "Набор массы" },
  { id: "weight_loss", label: "Похудение" },
  { id: "endurance", label: "Выносливость" },
  { id: "flexibility", label: "Гибкость" },
  { id: "health", label: "Здоровье" },
];

const MODULES = Object.entries(MODULE_META) as [ModuleKey, (typeof MODULE_META)[ModuleKey]][];

function Chip({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-2 text-sm transition-colors",
        active ? cn("border-transparent text-zinc-900", accent ?? "bg-zinc-100") : "border-border",
      )}
    >
      {children}
    </button>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>(["workouts"]);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [saving, setSaving] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function finish() {
    setSaving(true);
    try {
      const user = await api.put<User>("/users/me", {
        gender,
        goals,
        enabled_modules: modules,
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
        age: age ? Number(age) : undefined,
        onboarded: true,
      });
      setUser(user);
      navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="mb-5 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-zinc-100" : "bg-border")}
            />
          ))}
        </div>

        {step === 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Ваши цели</h2>
            <p className="text-sm text-muted">Можно выбрать несколько — влияет на расчёты и советы.</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <Chip key={g.id} active={goals.includes(g.id)} onClick={() => toggle(goals, setGoals, g.id)}>
                  {g.label}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Какие модули вам нужны</h2>
            <p className="text-sm text-muted">Модули независимы, состав можно изменить позже.</p>
            <div className="flex flex-wrap gap-2">
              {MODULES.map(([key, meta]) => (
                <Chip
                  key={key}
                  active={modules.includes(key)}
                  accent={meta.bg}
                  onClick={() => toggle(modules, setModules, key)}
                >
                  {meta.label}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Параметры</h2>
            <p className="text-sm text-muted">Нужны для формул целей (калории, БЖУ, подходы).</p>
            <div className="flex gap-2">
              <Chip active={gender === "male"} onClick={() => setGender("male")}>
                Мужской
              </Chip>
              <Chip active={gender === "female"} onClick={() => setGender("female")}>
                Женский
              </Chip>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                className="h-11 rounded-2xl border border-border bg-bg px-3 text-sm outline-none"
                placeholder="Вес, кг"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <input
                className="h-11 rounded-2xl border border-border bg-bg px-3 text-sm outline-none"
                placeholder="Рост, см"
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
              <input
                className="h-11 rounded-2xl border border-border bg-bg px-3 text-sm outline-none"
                placeholder="Возраст"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </section>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Назад
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Далее</Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              Готово
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
