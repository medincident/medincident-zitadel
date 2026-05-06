import type { Metadata } from 'next';
import { Eye, Settings2, Sliders, Sun } from 'lucide-react';
import { PageHeader } from '../_components/page-header';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { SettingsSection } from './_components/settings-section';
import { FontSizeSection } from './_components/font-size-section';
import { ContrastPicker } from './_components/contrast-picker';
import { LetterSpacingPicker } from './_components/letter-spacing-picker';
import { HideImagesToggle } from './_components/hide-images-toggle';
import { AnimationsToggle } from './_components/animations-toggle';
import { ResetButton } from './_components/reset-button';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Настройки',
};

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Настройки приложения"
        description="Внешний вид и поведение интерфейса"
        icon={Settings2}
      />

      <SettingsSection icon={Sliders} title="Общие" className="space-y-6">
        <SettingsSection icon={Sun} title="Тема" level="h2">
          <ThemeToggle />
        </SettingsSection>
        <FontSizeSection />
      </SettingsSection>

      <SettingsSection
        icon={Eye}
        title="Специальные возможности"
        action={<Suspense><ResetButton /></Suspense>}
        className="space-y-6"
      >
        <LetterSpacingPicker />
        <ContrastPicker />
        <div className="space-y-3 ml-4">
          <HideImagesToggle />
          <AnimationsToggle />
        </div>
      </SettingsSection>
    </div>
  );
}
