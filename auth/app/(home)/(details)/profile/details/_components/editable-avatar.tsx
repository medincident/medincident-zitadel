"use client";

import { useCallback, useState, useRef, useTransition, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { uploadAvatarAction } from "../profile.actions";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useProfileStore } from "../../profile.store";

const MAX_AVATAR_SIZE = 512 * 1024; // 512 КБ — лимит Zitadel
const AVATAR_MAX_DIMENSION = 256; // px — больше для аватарки не нужно

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, AVATAR_MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Пробуем webp → jpeg с понижением качества, пока не влезем в лимит
      const tryCompress = (format: string, quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Не удалось сжать изображение"));
            if (blob.size <= MAX_AVATAR_SIZE || quality <= 0.3) {
              resolve(blob);
            } else {
              tryCompress(format, quality - 0.1);
            }
          },
          format,
          quality,
        );
      };

      tryCompress("image/webp", 0.8);
    };
    img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
    img.src = URL.createObjectURL(file);
  });
}

interface EditableAvatarProps {
  currentAvatarUrl: string | undefined;
  initials: string;
}

export function EditableAvatar({ currentAvatarUrl, initials }: EditableAvatarProps) {
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl);
  const setProfile = useProfileStore((s) => s.setProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      startTransition(async () => {
        try {
          const compressed = file.size > MAX_AVATAR_SIZE ? await compressImage(file) : file;

          if (compressed.size > MAX_AVATAR_SIZE) {
            toast.error("Не удалось сжать изображение до 512 КБ. Выберите файл поменьше");
            return;
          }

          const objectUrl = URL.createObjectURL(compressed);
          objectUrlRef.current = objectUrl;
          setPreviewUrl(objectUrl);
          setProfile({ photoUrl: objectUrl });

          const formData = new FormData();
          formData.append("avatar", compressed, file.name);

          const result = await uploadAvatarAction(formData);

          if (!result?.success) {
            setPreviewUrl(currentAvatarUrl);
            setProfile({ photoUrl: currentAvatarUrl ?? null });
            console.error("Ошибка при загрузке аватара:", result?.error);
            toast.error(result?.error || "Ошибка загрузки");
          }

          if (objectUrlRef.current === objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrlRef.current = null;
          }
        } catch {
          toast.error("Не удалось обработать изображение");
        }
      });
    },
    [currentAvatarUrl, setProfile],
  );

  const triggerFileInput = useCallback(() => fileInputRef.current?.click(), []);

  return (
    <div className="relative size-16 group/edit cursor-pointer rounded-full" onClick={triggerFileInput}>
      <Avatar className="size-16 border border-border">
        <AvatarImage src={previewUrl} alt="Аватар пользователя" className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out",
          isPending ? "bg-black/80 opacity-100" : "bg-black/50 opacity-0 group-hover/edit:opacity-100",
        )}
      >
        {isPending ? (
          <Loader2 className="size-5 text-white/80 animate-spin" />
        ) : (
          <Camera className="size-5 text-white/70 transition-transform duration-300 ease-in-out group-hover/edit:scale-110" />
        )}
      </div>

      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isPending}
      />
    </div>
  );
}
