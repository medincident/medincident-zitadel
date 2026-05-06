"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ForgotPasswordRequestState } from "../actions";

interface Props {
  action: (state: ForgotPasswordRequestState, formData: FormData) => Promise<ForgotPasswordRequestState>;
  loginHref: string;
}

export function ForgotPasswordRequestForm({ action, loginHref }: Props) {
  const [state, formAction, isPending] = useActionState<ForgotPasswordRequestState, FormData>(
    action,
    { errors: {} }
  );

  if (state.sent) {
    return (
      <div className="space-y-4 text-center animate-in fade-in duration-300">
        <div className="p-4 bg-primary/10 text-foreground border border-primary/20 rounded-md text-sm">
          Если такой email зарегистрирован, мы отправили на него письмо с кодом для сброса пароля.
          Проверьте папку «Спам», если письма нет.
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={loginHref}>Вернуться ко входу</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.errors?.form && (
        <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm text-center">
          {state.errors.form}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className={cn(state.errors?.email && "text-destructive")}>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={state.values?.email}
          placeholder="you@example.com"
          disabled={isPending}
          autoComplete="email"
          autoFocus
          className={cn(state.errors?.email && "border-destructive focus-visible:ring-destructive", "bg-card")}
        />
        {state.errors?.email && (
          <span className="text-[11px] font-medium text-destructive block">{state.errors.email}</span>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button asChild variant="outline" className="flex-1 bg-card" disabled={isPending}>
          <Link href={loginHref}>Отмена</Link>
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отправить код"}
        </Button>
      </div>
    </form>
  );
}
