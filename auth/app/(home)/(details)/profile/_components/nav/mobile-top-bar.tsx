"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { AppLogoIcon } from "@/app/_components/icons";
import { APP_NAME } from "@/shared/lib/constants";
import { QrScannerButton } from "../qr-scanner-button";

export function MobileTopBar({ adminSlot }: { adminSlot?: ReactNode }) {
  const from = useSearchParams().get("from");

  return (
    <div className="flex items-center justify-between px-4 py-2 h-14">
      <div className="flex items-center gap-2">
        <AppLogoIcon className="size-6 text-primary" />
        <span className="text-primary font-medium">{APP_NAME}</span>

        {adminSlot}
      </div>

      <div className="flex items-center gap-1 -mr-2">
        <QrScannerButton variant="icon" />

        {from && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:bg-muted-foreground/10 hover:text-primary"
          >
            <Link href={from}>
              <ArrowLeft className="size-5 mr-1" />
              Вернуться
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
