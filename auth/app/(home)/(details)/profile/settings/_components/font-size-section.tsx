'use client';

import { Type } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSettingsStore, type FontSize } from '@/shared/stores/settings.store';
import { SettingsSection } from './settings-section';
import { OptionButton } from './option-button';

const FONT_SIZES: { value: FontSize; label: string; preview: string; previewSize: string }[] = [
  { value: 'md', label: 'Стандартный',    preview: 'Aa', previewSize: 'text-base' },
  { value: 'lg', label: 'Крупный',        preview: 'Aa', previewSize: 'text-xl'   },
  { value: 'xl', label: 'Очень крупный',  preview: 'Aa', previewSize: 'text-3xl'  },
];

export function FontSizeSection() {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);

  return (
    <SettingsSection icon={Type} title="Размер шрифта" level="h2">
      <div className="flex justify-center gap-4">
        {FONT_SIZES.map(({ value, label, preview, previewSize }) => (
          <OptionButton
            key={value}
            active={fontSize === value}
            onClick={() => setFontSize(value)}
            className="flex-1"
          >
            <span className={cn('font-semibold leading-none', previewSize)}>{preview}</span>
            <span className="text-xs">{label}</span>
          </OptionButton>
        ))}
      </div>
    </SettingsSection>
  );
}
