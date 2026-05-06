'use client';

import { ALargeSmall } from 'lucide-react';
import { useSettingsStore, type LetterSpacing } from '@/shared/stores/settings.store';
import { SettingsSection } from './settings-section';
import { OptionButton } from './option-button';

const LETTER_SPACINGS: { value: LetterSpacing; label: string; letterSpacing: string }[] = [
  { value: 'normal', label: 'Обычный',  letterSpacing: '0'      },
  { value: 'md',     label: 'Средний',  letterSpacing: '0.06em' },
  { value: 'lg',     label: 'Большой',  letterSpacing: '0.12em' },
];

export function LetterSpacingPicker() {
  const letterSpacing = useSettingsStore((s) => s.letterSpacing);
  const setLetterSpacing = useSettingsStore((s) => s.setLetterSpacing);

  return (
    <SettingsSection icon={ALargeSmall} title="Межбуквенный интервал" level="h2">
      <div className="flex justify-center gap-4">
        {LETTER_SPACINGS.map(({ value, label, letterSpacing: ls }) => (
          <OptionButton
            key={value}
            active={letterSpacing === value}
            onClick={() => setLetterSpacing(value)}
            className="flex-1"
          >
            <span
              className="text-base font-semibold leading-none"
              style={{ letterSpacing: ls }}
            >
              Абвгд
            </span>
            <span>{label}</span>
          </OptionButton>
        ))}
      </div>
    </SettingsSection>
  );
}
