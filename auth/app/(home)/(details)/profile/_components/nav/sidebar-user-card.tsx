"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useProfileStore } from "../../profile.store";
import { useProfileData } from "../../details/profile.hooks";

export interface Props {
  isActive: boolean;
}

export function SidebarUserCard({ isActive }: Props) {
  const { isLoading } = useProfileData();
  const { firstName, lastName, photoUrl } = useProfileStore(
    useShallow((state) => ({
      firstName: state.firstName,
      lastName: state.lastName,
      photoUrl: state.photoUrl,
    })),
  );

  const hasData = !!(firstName || lastName);
  const showSkeleton = !hasData || isLoading;
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const skeletonTone = isActive ? "bg-primary/20" : "";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200",
        isActive ? "bg-primary/10 shadow-sm" : "hover:bg-muted",
      )}
    >
      <Avatar className="size-10 relative shrink-0">
        {showSkeleton ? (
          <Skeleton className={cn("size-full rounded-full", skeletonTone)} />
        ) : (
          <>
            {photoUrl && <AvatarImage key={photoUrl} src={photoUrl} alt="Avatar" className="object-cover" />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 min-w-0 text-left flex flex-col justify-center gap-0.5">
        {showSkeleton ? (
          <Skeleton className={cn("h-4 w-24 mb-1", skeletonTone)} />
        ) : (
          <h4
            className={cn(
              "text-sm font-bold truncate transition-all",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
            )}
          >
            {firstName} {lastName}
          </h4>
        )}
        <p className="text-xs text-muted-foreground truncate">Редактировать</p>
      </div>
    </div>
  );
}
