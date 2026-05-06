'use client';

import { Fragment, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented';
  className?: string;
}

const THEMES = [
  { value: 'light',  label: 'Светлая',   icon: Sun },
  { value: 'dark',   label: 'Тёмная',    icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor },
] as const;

type ThemeValue = (typeof THEMES)[number]['value'];

function nextTheme(current: string | undefined): ThemeValue {
  const order: ThemeValue[] = ['light', 'dark', 'system'];
  const idx = order.indexOf(current as ThemeValue);
  return order[(idx + 1) % order.length];
}

export function ThemeToggle({ variant = 'segmented', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (variant === 'icon') {
    const current = THEMES.find((t) => t.value === theme) ?? THEMES[0];
    const Icon = current.icon;
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={() => setTheme(nextTheme(theme))}
        title={`Тема: ${current.label}`}
      >
        <Icon />
      </Button>
    );
  }

  return (
    <div className={cn('flex rounded-xl border border-border bg-muted p-1', className)}>
      {THEMES.map(({ value, label, icon: Icon }, idx) => {
        const isActive = mounted && theme === value;
        return (
          <Fragment key={value}>
            {idx > 0 && (
              <div className="my-2 w-px self-stretch bg-border" aria-hidden />
            )}
            <button
              onClick={() => setTheme(value)}
              title={label}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="inline">{label}</span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
