'use client';

import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/utils';

interface ToggleRowProps {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleRow({ id, icon: Icon, label, checked, onChange }: ToggleRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <div
        className={cn(
          'relative ml-4 h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-input'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 size-4 rounded-full bg-card shadow-sm transition-transform',
            checked && 'translate-x-4'
          )}
        />
      </div>
    </label>
  );
}
