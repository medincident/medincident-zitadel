"use client";

import { useCallback, useState, useTransition } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { KeyRound, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PasswordRequirements } from "@/shared/ui/password-requirements";
import { changePasswordAction } from "../security.actions";
import { toast } from "sonner";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z
      .string()
      .min(8, "Не менее 8 символов")
      .max(70, "Не более 70 символов")
      .regex(/[A-ZА-ЯЁ]/, "Должен содержать заглавную букву")
      .regex(/[a-zа-яё]/, "Должен содержать строчную букву")
      .regex(/\d/, "Должен содержать цифру")
      .regex(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/, "Должен содержать символ или знак пунктуации"),
    confirmPassword: z.string().min(1, "Подтвердите новый пароль"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  errorMessage?: string;
  registration: UseFormRegisterReturn;
  children?: React.ReactNode;
}

function PasswordField({ id, label, autoComplete, errorMessage, registration, children }: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        className={cn(errorMessage && "border-destructive focus-visible:ring-destructive")}
        {...registration}
      />
      {children}
      {errorMessage && <p className="text-2xs text-destructive">{errorMessage}</p>}
    </div>
  );
}

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPasswordValue = useWatch({ control, name: "newPassword" }) ?? "";

  const onSubmit = useCallback(
    (data: ChangePasswordForm) => {
      startTransition(async () => {
        const result = await changePasswordAction(data.currentPassword, data.newPassword);
        if (result.success) {
          toast.success("Пароль успешно изменён");
          setOpen(false);
          reset();
        } else {
          toast.error(result.error || "Не удалось сменить пароль");
        }
      });
    },
    [reset],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) reset();
    },
    [reset],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <KeyRound className="size-4" />
          Сменить пароль
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Смена пароля</DialogTitle>
          <DialogDescription>Введите текущий пароль и задайте новый</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <PasswordField
            id="currentPassword"
            label="Текущий пароль"
            autoComplete="current-password"
            errorMessage={errors.currentPassword?.message}
            registration={register("currentPassword")}
          />

          <PasswordField
            id="newPassword"
            label="Новый пароль"
            autoComplete="new-password"
            registration={register("newPassword")}
          >
            <PasswordRequirements password={newPasswordValue} />
          </PasswordField>

          <PasswordField
            id="confirmPassword"
            label="Подтвердите пароль"
            autoComplete="new-password"
            errorMessage={errors.confirmPassword?.message}
            registration={register("confirmPassword")}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 animate-spin" />}
            Сменить пароль
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
