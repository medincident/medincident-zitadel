import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Separator } from "@/shared/ui/separator";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Icon className="size-6" />
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
        </div>
      </div>

      <Separator />
    </div>
  );
}
