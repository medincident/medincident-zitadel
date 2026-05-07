import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { cn } from "@/shared/lib/utils";
import "./globals.css";
import { APP_NAME } from "@/shared/lib/constants";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import { SettingsProvider } from "@/shared/ui/settings-provider";
import z from "zod";
import { ru } from "zod/v4/locales";
import { Toaster } from "@/shared/ui/sonner";

z.config(ru());

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: "Вход в медицинскую систему",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn("scroll-smooth", GeistSans.variable, GeistMono.variable)}
      lang="ru"
      suppressHydrationWarning
    >
      <body className="bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            {children}
            <Toaster richColors position="top-center" />
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}