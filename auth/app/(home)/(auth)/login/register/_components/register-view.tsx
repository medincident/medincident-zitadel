"use client";

import { useState, useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PasswordRequirements } from "@/shared/ui/password-requirements";
import { CONSENT_URL, PRIVACY_URL, TERMS_URL } from "@/shared/lib/constants";

// 1. Define the shape of your form fields
export interface RegisterFormValues {
  givenName: string;
  familyName: string;
  middleName: string;
  email: string;
}

// 2. Define the exact fields that can have errors, plus a generic 'form' error
export interface RegisterFormErrors {
  form?: string;
  givenName?: string;
  familyName?: string;
  middleName?: string;
  email?: string;
  password?: string;
  confirm?: string;
  agreeTerms?: string;
  agreePdn?: string;
}

// 3. Define the overall state returned by the Server Action
export interface RegisterFormState {
  success: boolean;
  errors?: RegisterFormErrors;
  values?: RegisterFormValues;
}

interface RegisterViewProps {
  action: (state: RegisterFormState, payload: FormData) => Promise<RegisterFormState>;
  initialData: RegisterFormValues;
  buttonLabel?: string;
  showPassword?: boolean;
}

export function RegisterView({ action, initialData, buttonLabel = "Продолжить", showPassword }: RegisterViewProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    errors: {},
    values: initialData // Кладем начальные данные в стейт
  });
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="w-full space-y-5 animate-in fade-in duration-300">

      {state.errors?.form && (
        <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm text-center">
          {state.errors.form}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="givenName" className={cn(state.errors?.givenName && "text-destructive")}>
            Имя
          </Label>
          <Input 
            id="givenName" 
            name="givenName" 
            // Берем значение из стейта: если была ошибка, оно восстановится
            defaultValue={state.values?.givenName} 
            disabled={isPending}
            placeholder="Иван"
            className={cn(state.errors?.givenName && "border-destructive focus-visible:ring-destructive", "bg-card")}
          />
          {state.errors?.givenName && (
            <span className="text-[11px] font-medium text-destructive mt-1 block leading-tight">
              {state.errors.givenName}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="familyName" className={cn(state.errors?.familyName && "text-destructive")}>
            Фамилия
          </Label>
          <Input 
            id="familyName" 
            name="familyName" 
            defaultValue={state.values?.familyName} 
            disabled={isPending}
            placeholder="Иванов"
            className={cn(state.errors?.familyName && "border-destructive focus-visible:ring-destructive", "bg-card")}
          />
          {state.errors?.familyName && (
            <span className="text-[11px] font-medium text-destructive mt-1 block leading-tight">
              {state.errors.familyName}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="middleName" className={cn(state.errors?.middleName && "text-destructive")}>
          Отчество
        </Label>
        <Input 
          id="middleName" 
          name="middleName" 
          defaultValue={state.values?.middleName}
          disabled={isPending}
          placeholder="Иванович (опционально)"
          className={cn(state.errors?.middleName && "border-destructive focus-visible:ring-destructive", "bg-card")}
        />
        {state.errors?.middleName && (
          <span className="text-[11px] font-medium text-destructive mt-1 block leading-tight">
            {state.errors.middleName}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className={cn(state.errors?.email && "text-destructive")}>
          Email
        </Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          defaultValue={state.values?.email} 
          disabled={isPending}
          placeholder="your@email.com"
          className={cn(state.errors?.email && "border-destructive focus-visible:ring-destructive", "bg-card")}
        />
        {state.errors?.email && (
          <span className="text-[11px] font-medium text-destructive mt-1 block leading-tight">
            {state.errors.email}
          </span>
        )}
      </div>

      {showPassword && (
        <>
          <div className="space-y-2">
            <Label htmlFor="password" className={cn(state.errors?.password && "text-destructive")}>
              Пароль
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
              <span className="text-[11px] font-medium text-destructive mt-1 block leading-tight">
                {state.errors.password}
              </span>
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
              <span className="text-[11px] font-medium text-destructive mt-1 block leading-tight">
                {state.errors.confirm}
              </span>
            )}
          </div>
        </>
      )}

      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground leading-relaxed">
          <input
            type="checkbox"
            name="agreeTerms"
            value="1"
            disabled={isPending}
            className={cn(
              "mt-0.5 size-4 shrink-0 rounded border-input accent-primary",
              state.errors?.agreeTerms && "outline outline-2 outline-destructive"
            )}
          />
          <span>
            Я принимаю{" "}
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              пользовательское соглашение
            </a>{" "}
            и{" "}
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              политику конфиденциальности
            </a>
            .
          </span>
        </label>
        {state.errors?.agreeTerms && (
          <span className="text-[11px] font-medium text-destructive block leading-tight">
            {state.errors.agreeTerms}
          </span>
        )}

        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground leading-relaxed">
          <input
            type="checkbox"
            name="agreePdn"
            value="1"
            disabled={isPending}
            className={cn(
              "mt-0.5 size-4 shrink-0 rounded border-input accent-primary",
              state.errors?.agreePdn && "outline outline-2 outline-destructive"
            )}
          />
          <span>
            Я даю{" "}
            <a href={CONSENT_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              согласие на обработку персональных данных
            </a>{" "}
            в соответствии с 152-ФЗ.
          </span>
        </label>
        {state.errors?.agreePdn && (
          <span className="text-[11px] font-medium text-destructive block leading-tight">
            {state.errors.agreePdn}
          </span>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            buttonLabel
          )}
        </Button>
      </div>
    </form>
  );
}