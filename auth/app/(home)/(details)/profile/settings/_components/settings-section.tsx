import type { LucideIcon } from 'lucide-react';
import { Suspense, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface SettingsSectionProps {
  icon?: LucideIcon;
  title: string;
  desc?: string;
  level?: 'h1' | 'h2';
  action?: ReactNode;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function SettingsSection({
  icon: Icon,
  title,
  desc,
  level = 'h1',
  action,
  children,
  fallback = null,
  className,
}: SettingsSectionProps) {
  const isSub = level === 'h2';

  return (
    <section className={cn('space-y-3', isSub && 'ml-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p
            className={cn(
              'flex items-center gap-2',
              isSub
                ? 'text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 ml-1'
                : 'section-label'
            )}
          >
            {Icon && <Icon className={isSub ? 'size-3.5' : 'size-4'} />}
            {title}
          </p>
          {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        </div>
        {action}
      </div>
      <Suspense fallback={fallback}>{children}</Suspense>
    </section>
  );
}
