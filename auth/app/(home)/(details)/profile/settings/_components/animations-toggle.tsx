'use client';

import { Zap } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { ToggleRow } from './toggle-row';

export function AnimationsToggle() {
  const animations = useSettingsStore((s) => s.animations);
  const setAnimations = useSettingsStore((s) => s.setAnimations);

  return (
    <ToggleRow
      id="animations-toggle"
      icon={Zap}
      label="Выключить анимации"
      checked={!animations}
      onChange={(value) => setAnimations(!value)}
    />
  );
}
