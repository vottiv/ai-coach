import { NavLink } from "react-router-dom";

import { NAV_ITEMS } from "@/config/modules";
import { cn } from "@/lib/utils";

export function BottomTabBar() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, color }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] text-muted transition-colors",
                  isActive && (color ?? "text-zinc-100"),
                )
              }
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
