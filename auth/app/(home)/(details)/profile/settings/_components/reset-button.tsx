'use client';

import { RotateCcw } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings.store';

export function ResetButton() {
  const { fontSize, contrast, letterSpacing, hideImages, resetAccessibility } = useSettingsStore();
  const hasChanges =
    contrast !== 'normal' || letterSpacing !== 'normal' || hideImages || fontSize !== 'md';

  if (!hasChanges) return null;

  return (
    <button
      onClick={resetAccessibility}
      className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <RotateCcw className="size-3" />
      Сбросить
    </button>
  );
}
