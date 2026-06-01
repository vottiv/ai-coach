import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export function Login() {
  const navigate = useNavigate();
  const { loginTelegram, loginEmail, registerEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Авто-вход в Telegram Mini App (ТЗ п. 3.3.1)
  useEffect(() => {
    loginTelegram()
      .then((ok) => ok && navigate("/", { replace: true }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        <p className="mt-4 text-center text-xs text-muted">
          Вход через Google — на следующем шаге настройки OAuth.
        </p>
      </Card>
    </div>
  );
}
