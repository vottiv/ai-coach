import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getTelegramInitData } from "@/lib/telegram";

export function Login() {
  const navigate = useNavigate();
  const { loginTelegram, loginEmail, registerEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isTelegram = Boolean(getTelegramInitData());

  useEffect(() => {
    if (!isTelegram) return;
    loginTelegram()
      .then((ok) => ok && navigate("/", { replace: true }))
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await loginEmail(email, password);
      else await registerEmail(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  async function handleTelegram() {
    setError(null);
    try {
      await loginTelegram();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка Telegram входа");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo className="h-14 w-14" />
          <div>
            <h1 className="text-xl font-semibold">AI Coach</h1>
            <p className="text-sm text-muted">Тренировки · Питание · Анализы · Ощущения</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={handleTelegram}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Войти через Telegram
          </Button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">или</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "register" && (
            <input
              className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-zinc-500"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-zinc-500"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-zinc-500"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
        </form>

        <button
          className="mt-4 w-full text-center text-sm text-muted hover:text-zinc-200"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
        </button>
      </Card>
    </div>
  );
}
