import { type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: string; // text-* класс цвета модуля
}

export function EmptyState({ icon: Icon, title, description, accent }: Props) {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <div className={cn("rounded-2xl bg-bg p-3", accent ?? "text-zinc-300")}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </Card>
  );
}
