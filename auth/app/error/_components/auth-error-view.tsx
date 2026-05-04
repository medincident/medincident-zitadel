"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { startZitadelSignIn } from "@/services/zitadel/user/sign-in";

const MAX_AUTO_RETRIES = 1;
const RETRY_COUNT_KEY = "oidc_error_retries";

export function AuthErrorView() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const retried = useRef(false);
  const [showError] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    let count = 0;
    try { count = Number(sessionStorage.getItem(RETRY_COUNT_KEY) || "0"); } catch {}
    return count >= MAX_AUTO_RETRIES;
  });

  useEffect(() => {
    if (retried.current) return;
    retried.current = true;

    let count = 0;
    try { count = Number(sessionStorage.getItem(RETRY_COUNT_KEY) || "0"); } catch {}

    if (count >= MAX_AUTO_RETRIES) {
      console.error("[auth:error] Превышен лимит автоматических попыток (%d). Ошибка: %s", count, error);
      return;
    }

    try { sessionStorage.setItem(RETRY_COUNT_KEY, String(count + 1)); } catch {}
    console.log("[auth:error] Автоматическая повторная попытка #%d, ошибка: %s", count + 1, error);
    startZitadelSignIn();
  }, [error]);

  const handleManualRetry = () => {
    try { sessionStorage.setItem(RETRY_COUNT_KEY, "0"); } catch {}
    startZitadelSignIn();
  };

  if (showError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Ошибка авторизации</h2>
          <p className="text-sm text-muted-foreground">
            Не удалось завершить вход. Попробуйте ещё раз.
          </p>
          <Button onClick={handleManualRetry} className="mt-2">
            <RefreshCw className="mr-2" />
            Повторить вход
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">
          Повторная авторизация...
        </p>
      </div>
    </div>
  );
}
