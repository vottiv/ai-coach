interface TelegramWebApp {
  initData: string;
  colorScheme: "light" | "dark";
  ready: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegram(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function getTelegramInitData(): string | null {
  const wa = getTelegram();
  if (wa && wa.initData) {
    wa.ready();
    wa.expand();
    return wa.initData;
  }
  return null;
}
