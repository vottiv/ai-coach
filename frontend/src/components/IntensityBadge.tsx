import { cn } from "@/lib/utils";

const INTENSITY_CONFIG = {
  extreme: {
    label: "Экстремальная",
    bgColor: "bg-red-600",
    textColor: "text-white",
    borderColor: "border-red-600",
  },
  very_heavy: {
    label: "Очень тяжелая",
    bgColor: "bg-orange-500",
    textColor: "text-white",
    borderColor: "border-orange-500",
  },
  heavy: {
    label: "Тяжелая",
    bgColor: "bg-yellow-500",
    textColor: "text-black",
    borderColor: "border-yellow-500",
  },
  moderate: {
    label: "Средняя",
    bgColor: "bg-green-500",
    textColor: "text-white",
    borderColor: "border-green-500",
  },
  very_light: {
    label: "Легкая",
    bgColor: "bg-blue-500",
    textColor: "text-white",
    borderColor: "border-blue-500",
  },
} as const;

export function IntensityBadge({ intensity }: { intensity: string }) {
  const config = INTENSITY_CONFIG[intensity as keyof typeof INTENSITY_CONFIG] || INTENSITY_CONFIG.very_light;

  return (
    <span className={cn(
      "rounded-lg px-2 py-1 text-xs font-medium border",
      config.bgColor,
      config.textColor,
      config.borderColor
    )}>
      {config.label}
    </span>
  );
}