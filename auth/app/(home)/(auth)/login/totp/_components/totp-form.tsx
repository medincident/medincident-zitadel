"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { CodeInput } from "@/shared/ui/code-input";
import { Loader2 } from "lucide-react";
import { TotpState } from "../actions";

interface Props {
  action: (state: TotpState, formData: FormData) => Promise<TotpState>;
}

export function TotpForm({ action }: Props) {
  const [state, formAction, isPending] = useActionState(action, { errors: {} });
  const router = useRouter();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Введите код из приложения-аутентификатора
      </p>

      <form action={formAction} className="space-y-5">
        {state.errors?.form && (
          <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm text-center space-y-2">
            <p>{state.errors.form}</p>
            {state.errors.expired && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Войти заново
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <CodeInput
            name="code"
            length={6}
            mode="numeric"
            disabled={isPending}
            autoFocus
            error={!!state.errors?.code}
          />
          {state.errors?.code && (
            <span className="text-2xs font-medium text-destructive">
              {state.errors.code}
            </span>
          )}
        </div>

        <div className="flex justify-center">
          <Button type="submit" size="sm" className="px-8" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : "Подтвердить"}
          </Button>
        </div>
      </form>
    </div>
  );
}
