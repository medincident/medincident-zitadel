'use client';

import { Contrast } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSettingsStore, type Contrast as ContrastValue } from '@/shared/stores/settings.store';
import { SettingsSection } from './settings-section';

const CONTRAST_OPTIONS: {
  value: ContrastValue;
  label: string;
  bg: string;
  text: string;
  border: string;
}[] = [
  { value: 'normal',      label: 'Обычный',   bg: 'bg-background',    text: 'text-foreground',    border: 'border-border' },
  { value: 'high-black',  label: 'Чёрный',    bg: 'bg-black',         text: 'text-white',         border: 'border-zinc-600' },
  { value: 'high-white',  label: 'Белый',     bg: 'bg-white',         text: 'text-black',         border: 'border-zinc-400' },
  { value: 'high-yellow', label: 'Жёлтый',    bg: 'bg-black',         text: 'text-yellow-400',    border: 'border-yellow-600' },
];

export function ContrastPicker() {
  const contrast = useSettingsStore((s) => s.contrast);
  const setContrast = useSettingsStore((s) => s.setContrast);

  return (
    <SettingsSection icon={Contrast} title="Контрастность" level="h2">
      <div className="flex justify-center gap-4">
        {CONTRAST_OPTIONS.map(({ value, label, bg, text, border }) => (
          <button
            key={value}
            type="button"
            onClick={() => setContrast(value)}
            title={label}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium transition-colors',
              bg, text, border,
              contrast === value
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                : 'opacity-80 hover:opacity-100'
            )}
          >
            <span className="text-base font-bold leading-none">Аа</span>
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}
