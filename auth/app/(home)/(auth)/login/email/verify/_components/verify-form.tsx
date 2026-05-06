"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { CodeInput } from "@/shared/ui/code-input";
import { Loader2 } from "lucide-react";
import { VerifyState } from "../actions";

interface Props {
  action: (state: VerifyState, formData: FormData) => Promise<VerifyState>;
  resendAction: () => Promise<void>;
  email: string;
}

export function VerifyForm({ action, resendAction, email }: Props) {
  const [state, formAction, isPending] = useActionState(action, { errors: {} });
  const router = useRouter();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Код отправлен на <span className="font-medium text-foreground">{email}</span>
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
            disabled={isPending}
            autoFocus
            error={!!state.errors?.code}
          />
          {state.errors?.code && (
            <span className="text-[11px] font-medium text-destructive">
              {state.errors.code}
            </span>
          )}
        </div>

        <div className="flex justify-center">
          <Button type="submit" size="sm" className="px-8" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Подтвердить"}
          </Button>
        </div>
      </form>

      <form action={resendAction} className="flex justify-center">
        <button
          type="submit"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Отправить код повторно
        </button>
      </form>
    </div>
  );
}
