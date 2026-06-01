import { ChevronRight, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MODULE_META, type ModuleKey } from "@/config/modules";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const enabled = (user?.enabled_modules ?? []) as ModuleKey[];
  const healthEnabled = enabled.length === 0 || enabled.includes("health");

  return (
    <div className="space-y-5">
      <PageHeader title="Профиль" />

      <Card className="flex items-center gap-4">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-14 w-14 rounded-full" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg text-lg">
            {user?.name?.[0] ?? "?"}
          </div>
        )}
        <div>
          <p className="font-medium">{user?.name}</p>
          {user?.username && <p className="text-sm text-muted">@{user.username}</p>}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Активные модули</h2>
        <div className="flex flex-wrap gap-2">
          {enabled.length === 0 && <p className="text-sm text-muted">Модули не выбраны.</p>}
          {enabled.map((key) => (
            <span
              key={key}
              className={cn("rounded-2xl px-3 py-1.5 text-sm text-zinc-900", MODULE_META[key].bg)}
            >
              {MODULE_META[key].label}
            </span>
          ))}
        </div>
      </Card>

      {healthEnabled && (
        <button onClick={() => navigate("/health")} className="block w-full text-left">
          <Card className="flex items-center gap-3 hover:border-zinc-600">
            <span className="rounded-2xl bg-bg p-2.5 text-health">
              <FlaskConical className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">Анализы</p>
              <p className="mt-0.5 text-xs text-muted">Загрузка и просмотр биомаркеров</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Card>
        </button>
      )}

      <Button variant="outline" className="w-full" onClick={logout}>
        Выйти
      </Button>
    </div>
  );
}
