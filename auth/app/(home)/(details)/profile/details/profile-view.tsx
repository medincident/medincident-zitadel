"use client";

import { ProfileForm, SECTION_CLASS } from "./_components/profile-form";
import { UserHeaderCard } from "./_components/user-header-card";
import { useProfileData, useFormProfileDetails } from "./profile.hooks";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-primary/15", className)}>
      <div className="shimmer shimmer-primary" />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
      <div className="flex items-center gap-5">
        <ShimmerBlock className="size-17 shrink-0 rounded-full" />
        <div className="flex-1 min-w-0 space-y-2">
          <ShimmerBlock className="h-6 w-44" />
          <ShimmerBlock className="h-4 w-32 bg-primary/10" />
          <ShimmerBlock className="h-3.5 w-20 bg-primary/10" />
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className={SECTION_CLASS}>
        <Skeleton className="h-3.5 w-28" />
        <div className="grid grid-cols-2 gap-4">
          {["w-10", "w-16"].map((w, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className={cn("h-3", w)} />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className={SECTION_CLASS}>
        <Skeleton className="h-3.5 w-20" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className={SECTION_CLASS}>
        <Skeleton className="h-3.5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 mt-4">
        <Skeleton className="h-8 w-[120px]" />
      </div>
    </div>
  );
}

export function ProfileUserHeaderView() {
  const { user, isLoading, isError } = useProfileData();

  if (isLoading) return <HeaderSkeleton />;

  if (isError) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-2">
        <AlertCircle className="size-5" />
        <span>Не удалось загрузить профиль</span>
      </div>
    );
  }

  if (!user) return null;
  return <UserHeaderCard user={user} />;
}

export function ProfileDetailsView() {
  const { user, isLoading } = useProfileData();
  const { state, actions } = useFormProfileDetails(user);

  if (isLoading) return <FormSkeleton />;
  if (!user) return null;

  return (
    <ProfileForm
      form={state.form}
      isSaving={state.isSaving}
      message={state.message}
      isEmailVerified={state.isEmailVerified}
      onSubmit={actions.onSubmit}
      onCancel={actions.onCancel}
    />
  );
}
