"use client";

import { UseFormReturn, FieldError } from "react-hook-form";
import { PersonalInfoFormData } from "@/domain/profile/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Loader2, CheckCircle2, AlertCircle, AlertTriangle,
  User, Mail, RotateCcw, Briefcase,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export const SECTION_CLASS =
  "space-y-4 p-5 rounded-xl border border-border/60 bg-card/50 backdrop-blur-xl";

export interface FormMessage {
  type: "success" | "error";
  text: string;
}

interface ProfileFormProps {
  form: UseFormReturn<PersonalInfoFormData>;
  isSaving: boolean;
  message: FormMessage | null;
  isEmailVerified?: boolean;
  onSubmit: (e: React.SyntheticEvent) => void;
  onCancel: () => void;
}

function SectionLabel({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <div className="flex items-center gap-2 select-none mb-3">
      <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</span>
    </div>
  );
}

function DirtyBadge() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning animate-in fade-in" />;
}

function FieldLabel({ htmlFor, children, isDirty, hasError }: {
  htmlFor: string;
  children: React.ReactNode;
  isDirty?: boolean;
  hasError?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className={cn("text-xs font-medium", hasError && "text-destructive")}>
        {children}
      </Label>
      {isDirty && <DirtyBadge />}
    </div>
  );
}

function EditableField({ id, label, isDirty, error, children }: {
  id: string;
  label: string;
  isDirty?: boolean;
  error?: FieldError;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} isDirty={isDirty} hasError={!!error}>{label}</FieldLabel>
      {children}
      {error && <p className="text-2xs text-destructive animate-in fade-in">{error.message}</p>}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input value={value} disabled className="bg-muted/50 text-muted-foreground" />
    </div>
  );
}

function EmailStatus({ isDirty, isVerified }: { isDirty: boolean; isVerified: boolean }) {
  const [cls, Icon, text] = isDirty
    ? ["bg-warning/10 text-warning", AlertTriangle, "Потребует подтверждения"] as const
    : isVerified
    ? ["bg-success/10 text-success", CheckCircle2, "Подтверждён"] as const
    : ["bg-destructive/10 text-destructive", AlertCircle, "Не подтверждён"] as const;

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold transition-colors duration-200", cls)}>
      <Icon className="w-3 h-3" />{text}
    </span>
  );
}

function capitalizeFirst(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function ProfileForm({
  form,
  isSaving,
  message,
  isEmailVerified = false,
  onSubmit,
  onCancel,
}: ProfileFormProps) {
  const { register, formState: { errors, isDirty, dirtyFields } } = form;

  const cap = (name: "firstName" | "lastName" | "middleName") => {
    const { onChange, ...rest } = register(name);
    return {
      ...rest,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = capitalizeFirst(e.target.value);
        onChange(e);
      },
    };
  };

  const inputError = (error?: FieldError) =>
    cn("bg-card", error && "border-destructive focus-visible:ring-destructive");

  return (
    <form onSubmit={onSubmit} className="space-y-3">

      {/* ── ЛИЧНЫЕ ДАННЫЕ ─── */}
      <div className={SECTION_CLASS}>
        <SectionLabel icon={User} label="Личные данные" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditableField id="firstName" label="Имя" isDirty={!!dirtyFields.firstName} error={errors.firstName}>
            <Input id="firstName" {...cap("firstName")} defaultValue={form.getValues().firstName}
              disabled={isSaving} placeholder="Иван" className={inputError(errors.firstName)} />
          </EditableField>
          <EditableField id="lastName" label="Фамилия" isDirty={!!dirtyFields.lastName} error={errors.lastName}>
            <Input id="lastName" {...cap("lastName")} defaultValue={form.getValues().lastName}
              disabled={isSaving} placeholder="Иванов" className={inputError(errors.lastName)} />
          </EditableField>
        </div>
        <EditableField id="middleName" label="Отчество" isDirty={!!dirtyFields.middleName} error={errors.middleName}>
          <Input id="middleName" {...cap("middleName")} defaultValue={form.getValues().middleName}
            disabled={isSaving} placeholder="Иванович" className={inputError(errors.middleName)} />
        </EditableField>
      </div>

      {/* ── КОНТАКТЫ ─── */}
      <div className={SECTION_CLASS}>
        <SectionLabel icon={Mail} label="Контакты" />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="email" isDirty={!!dirtyFields.email} hasError={!!errors.email}>Email</FieldLabel>
            <EmailStatus isDirty={!!dirtyFields.email} isVerified={isEmailVerified} />
          </div>
          <Input id="email" type="email" {...register("email")} defaultValue={form.getValues().email}
            disabled={isSaving} placeholder="ivan@example.com" className={inputError(errors.email)} />
          {errors.email && <p className="text-2xs text-destructive animate-in fade-in">{errors.email.message}</p>}
        </div>
      </div>

      {/* ── РАБОЧИЕ ДАННЫЕ ─── */}
      <div className={SECTION_CLASS}>
        <SectionLabel icon={Briefcase} label="Рабочие данные" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="Организация" value="ГБУЗ «СМП Москвы»" />
          <ReadOnlyField label="Отделение" value="Бригада экстренной помощи" />
          <ReadOnlyField label="Должность" value="Врач скорой помощи" />
          <ReadOnlyField label="Специализация" value="Кардиология" />
        </div>
      </div>

      {/* ── FOOTER ─── */}
      <div className="flex items-center justify-end gap-2 pt-4 mt-4 min-h-[36px]">
        {message && (
          <div className={cn(
            "flex-1 flex items-center gap-1.5 text-xs font-medium animate-in fade-in zoom-in-95",
            message.type === "success" ? "text-success" : "text-destructive",
          )}>
            {message.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {message.text}
          </div>
        )}
        {isDirty && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}
            className="gap-1.5 text-muted-foreground animate-in fade-in">
            <RotateCcw className="w-3.5 h-3.5" />Отменить
          </Button>
        )}
        <Button type="submit" disabled={isSaving || !isDirty} size="sm" className="min-w-[120px] gap-2">
          {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Сохраняем</> : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
