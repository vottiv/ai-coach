import { NavLink } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { NAV_ITEMS } from "@/config/modules";
import { cn } from "@/lib/utils";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/60 p-4 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Logo className="h-8 w-8" />
        <span className="text-lg font-semibold">AI Coach</span>
      </div>
      <nav>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, color }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-bg hover:text-zinc-100",
                    isActive && cn("bg-bg text-zinc-100", color),
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
