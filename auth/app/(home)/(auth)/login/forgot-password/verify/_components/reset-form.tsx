"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { CodeInput } from "@/shared/ui/code-input";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PasswordRequirements } from "@/shared/ui/password-requirements";
import { ResetPasswordState } from "../../actions";

interface Props {
  action: (state: ResetPasswordState, formData: FormData) => Promise<ResetPasswordState>;
  resendAction: () => Promise<void>;
  loginHref: string;
  defaultCode?: string;
}

export function ResetPasswordForm({ action, resendAction, loginHref, defaultCode }: Props) {
  const [state, formAction, isPending] = useActionState<ResetPasswordState, FormData>(
    action,
    { errors: {} }
  );
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        {state.errors?.form && (
          <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm text-center">
            {state.errors.form}
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <CodeInput
            name="code"
            length={6}
            defaultValue={defaultCode}
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

        <div className="space-y-2">
          <Label htmlFor="password" className={cn(state.errors?.password && "text-destructive")}>
            Новый пароль
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
            placeholder="Не менее 8 символов"
            onChange={(e) => setPassword(e.target.value)}
            className={cn(state.errors?.password && "border-destructive focus-visible:ring-destructive", "bg-card")}
          />
          <PasswordRequirements password={password} />
          {state.errors?.password && (
            <span className="text-[11px] font-medium text-destructive block">{state.errors.password}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className={cn(state.errors?.confirm && "text-destructive")}>
            Повторите пароль
          </Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
            placeholder="Повторите пароль"
            className={cn(state.errors?.confirm && "border-destructive focus-visible:ring-destructive", "bg-card")}
          />
          {state.errors?.confirm && (
            <span className="text-[11px] font-medium text-destructive block">{state.errors.confirm}</span>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button asChild variant="outline" className="flex-1 bg-card" disabled={isPending}>
            <Link href={loginHref}>Отмена</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сменить пароль"}
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
