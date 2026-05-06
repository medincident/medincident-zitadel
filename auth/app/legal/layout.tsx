import { ReactNode } from "react";
import Link from "next/link";
import { AppLogoIcon } from "@/app/_components/icons";
import { APP_NAME } from "@/shared/lib/constants";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen w-full flex justify-center p-4 sm:p-6 bg-background">
      <article className="w-full max-w-3xl py-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground">
          <span className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
            <AppLogoIcon className="size-4" />
          </span>
          <span className="text-sm font-medium">{APP_NAME}</span>
        </Link>
        <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
          {children}
        </div>
      </article>
    </main>
  );
}
