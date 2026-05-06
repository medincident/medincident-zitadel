'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface OptionButtonProps {
  active: boolean;
  onClick: () => void;
  title?: string;
  className?: string;
  children: ReactNode;
}

export function OptionButton({ active, onClick, title, className, children }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}
