"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { EmailLoginState } from "../actions";
import { env } from "@/shared/config/env";

interface Props {
  action: (state: EmailLoginState, formData: FormData) => Promise<EmailLoginState>;
  registerHref: string;
  forgotPasswordHref: string;
  initialState: any
}

export function EmailLoginForm({ action, registerHref, forgotPasswordHref, initialState }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.errors?.form && (
        <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm text-center">
          {state.errors.form}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className={cn(state.errors?.email && "text-destructive")}>
          Email или имя пользователя
        </Label>
        <Input
          id="email"
          name="email"
          type="text"
          defaultValue={state.values?.email}
          placeholder="you@example.com или username"
          disabled={isPending}
          autoComplete="username"
          className={cn(state.errors?.email && "border-destructive focus-visible:ring-destructive", "bg-card")}
        />
        {state.errors?.email && (
          <span className="text-[11px] font-medium text-destructive block">{state.errors.email}</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className={cn(state.errors?.password && "text-destructive")}>
            Пароль
          </Label>
          <Link
            href={forgotPasswordHref}
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
            tabIndex={-1}
          >
            Забыли пароль?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          defaultValue={state.values?.password}
          placeholder="••••••••"
          disabled={isPending}
          autoComplete="current-password"
          className={cn(state.errors?.password && "border-destructive focus-visible:ring-destructive", "bg-card")}
        />
        {state.errors?.password && (
          <span className="text-[11px] font-medium text-destructive block">{state.errors.password}</span>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 bg-card" asChild disabled={isPending}>
          <Link href={registerHref}>Создать аккаунт</Link>
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Войти"}
        </Button>
      </div>
    </form>
  );
}
