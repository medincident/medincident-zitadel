'use client';

import { ImageOff } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { ToggleRow } from './toggle-row';

export function HideImagesToggle() {
  const hideImages = useSettingsStore((s) => s.hideImages);
  const setHideImages = useSettingsStore((s) => s.setHideImages);

  return (
    <ToggleRow
      id="hide-images-toggle"
      icon={ImageOff}
      label="Скрыть изображения"
      checked={hideImages}
      onChange={setHideImages}
    />
  );
}
