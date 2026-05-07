"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";

import { PersonalInfo } from "@/domain/profile/types";
import { personalInfoSchema } from "@/domain/profile/schema";
import { useProfileStore } from "../profile.store";

import { getProfileDataAction, updateProfileDataAction } from "./profile.actions";

export type ProfileFormData = z.infer<typeof personalInfoSchema>;

export interface ProfileMessage {
  type: "success" | "error";
  text: string;
}

const PROFILE_API_KEY = "profile-me";

const FORM_DEFAULTS: ProfileFormData = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
};

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
} as const;

export function useProfileData() {
  const setProfileStore = useProfileStore((s) => s.setProfile);

  const onSuccess = useCallback(
    (data: PersonalInfo) =>
      setProfileStore({
        firstName: data.firstName,
        lastName: data.lastName,
        photoUrl: data.avatarUrl,
        isEmailVerified: data.isEmailVerified,
        email: data.email,
      }),
    [setProfileStore],
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR<PersonalInfo>(
    PROFILE_API_KEY,
    getProfileDataAction,
    { ...SWR_OPTIONS, onSuccess },
  );

  return { user: data, isLoading, isValidating, isError: error, mutate };
}

export function useFormProfileDetails(user?: PersonalInfo) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<ProfileMessage | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: "onChange",
    defaultValues: FORM_DEFAULTS,
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || "",
      email: user.email,
    });
  }, [user, form]);

  const onSubmit = useMemo(
    () =>
      form.handleSubmit((data) => {
        setMessage(null);
        startTransition(async () => {
          const result = await updateProfileDataAction(data);

          if (result && !result.success) {
            setMessage({ type: "error", text: result.error });
            return;
          }

          await mutate(PROFILE_API_KEY, result.data, false);
          router.refresh();

          // Сбрасываем isDirty, чтобы кнопка «Сохранить» задизейблилась.
          form.reset({ ...form.getValues() });

          setMessage({ type: "success", text: "Данные успешно сохранены" });
          setTimeout(() => setMessage(null), 3000);
        });
      }),
    [form, mutate, router],
  );

  const onCancel = useCallback(() => {
    setMessage(null);
    form.reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      middleName: user?.middleName ?? "",
      email: user?.email ?? "",
    });
  }, [form, user]);

  const state = useMemo(
    () => ({
      form,
      isSaving: isPending,
      message,
      isEmailVerified: user?.isEmailVerified ?? false,
    }),
    [form, isPending, message, user?.isEmailVerified],
  );

  const actions = useMemo(() => ({ onSubmit, onCancel }), [onSubmit, onCancel]);

  return { state, actions };
}
