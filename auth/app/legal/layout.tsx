import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppLogoIcon } from "@/app/_components/icons";
import { APP_NAME } from "@/shared/lib/constants";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="h-dvh overflow-y-auto w-full bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-12">
        <header className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Вернуться"
            className="inline-flex items-center gap-1.5 -ml-2 px-2 h-9 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="text-sm font-medium">Назад</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-sm font-medium">{APP_NAME}</span>
            <span className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
              <AppLogoIcon className="size-4" />
            </span>
          </Link>
        </header>
        {children}
      </div>
    </main>
  );
}
