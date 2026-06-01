import { Dumbbell, HeartPulse, Home, User, Utensils, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind-классы акцентного цвета модуля (ТЗ п. 4.2) */
  color?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Главная", icon: Home },
  { to: "/workouts", label: "Тренировки", icon: Dumbbell, color: "text-workouts" },
  { to: "/nutrition", label: "Питание", icon: Utensils, color: "text-nutrition" },
  { to: "/feelings", label: "Ощущения", icon: HeartPulse, color: "text-feelings" },
  { to: "/profile", label: "Профиль", icon: User },
];

export const MODULE_META = {
  workouts: { label: "Тренировки", color: "workouts", text: "text-workouts", bg: "bg-workouts" },
  nutrition: { label: "Питание", color: "nutrition", text: "text-nutrition", bg: "bg-nutrition" },
  health: { label: "Анализы", color: "health", text: "text-health", bg: "bg-health" },
  feelings: { label: "Ощущения", color: "feelings", text: "text-feelings", bg: "bg-feelings" },
} as const;

export type ModuleKey = keyof typeof MODULE_META;
