"use server";

import { requireValidSession } from "@/services/zitadel/session";
import { ProfileFormData } from "./profile.hooks";

import { updateHumanEmail, updateUserMiddleName, getUserMiddleName } from "@/services/zitadel/api";
import { getMe, updateMyProfile, uploadMyAvatar } from "@/services/zitadel/user/requests/profile";
import {
  getMyIdentity,
  getMyOrgRole,
  getMyEmployment,
  listMyOrganizations,
} from "@/services/backend/requests/roles";
import { revalidatePath } from "next/cache";

function buildRoles(opts: {
  isSystemAdmin: boolean;
  isOrgHead: boolean;
  isOrgAdmin: boolean;
  isOrgDispatcher: boolean;
}): string[] {
  const roles: string[] = [];
  if (opts.isSystemAdmin) roles.push("Системный администратор");
  if (opts.isOrgHead) roles.push("Главврач");
  if (opts.isOrgAdmin) roles.push("Администратор");
  if (opts.isOrgDispatcher) roles.push("Диспетчер");
  return roles;
}

export async function getProfileDataAction() {
  const { userId } = await requireValidSession();

  const [userResult, middleName, identityRes, orgsRes] = await Promise.all([
    getMe(userId),
    getUserMiddleName(userId),
    getMyIdentity(),
    listMyOrganizations(),
  ]);

  if (!userResult.success) {
    throw new Error("Не удалось получить данные пользователя");
  }

  const human = userResult.data.user?.human;
  const isSystemAdmin = identityRes.success ? !!identityRes.data.isSystemAdmin : false;
  const orgId = orgsRes.success
    ? (orgsRes.data.items ?? []).map((o) => o.id).find((id): id is string => !!id)
    : undefined;

  const [orgRoleRes, employmentRes] = orgId
    ? await Promise.all([getMyOrgRole(orgId), getMyEmployment(orgId)])
    : [undefined, undefined];

  const role = orgRoleRes?.success ? orgRoleRes.data : undefined;
  const employee = employmentRes?.success ? employmentRes.data.employee : undefined;

  const roles = buildRoles({
    isSystemAdmin,
    isOrgHead: !!role?.isOrgHead,
    isOrgAdmin: !!role?.isOrgAdmin,
    isOrgDispatcher: !!role?.isOrgDispatcher,
  });

  return {
    id: userId,
    firstName: human?.profile?.givenName || "",
    lastName: human?.profile?.familyName || "",
    middleName: middleName,
    email: human?.email?.email || "",
    isEmailVerified: human?.email?.isVerified || false,
    position: employee?.position || roles[0] || "Сотрудник",
    avatarUrl: human?.profile?.avatarUrl || "",
    roles,
    organizationName: employee?.organizationName,
    clinicName: employee?.clinicName,
    departmentName: employee?.departmentName,
  };
}

// PATCH
export async function updateProfileDataAction(data: ProfileFormData) {
  const { userId } = await requireValidSession();
  try {
    await updateMyProfile(userId, { givenName: data.firstName, familyName: data.lastName });

    // Обновляем email только если он реально изменился (case-insensitive, чтобы не триггерить на UPPER/lower)
    if (data.email && data.email.trim().length > 0) {
      const currentData = await getMe(userId);
      const currentEmail = currentData.success ? currentData.data?.user?.human?.email?.email : undefined;
      if (data.email.toLowerCase() !== currentEmail?.toLowerCase()) {
        await updateHumanEmail(userId, data.email.trim());
      }
    }

    if (data.middleName !== undefined) {
      await updateUserMiddleName(userId, data.middleName);
    }

    return { success: true, data: await getProfileDataAction() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

const MAX_AVATAR_SIZE = 512 * 1024; // 512 КБ — лимит Zitadel

export async function uploadAvatarAction(formData: FormData) {
  await requireValidSession();
  const file = formData.get("avatar") as File | null;
  if (!file) {
    return { success: false, error: "Файл не выбран" };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { success: false, error: "Максимальный размер аватара — 512 КБ" };
  }

  const result = await uploadMyAvatar(file);

  if (!result.success) {
    const code = result.error.code;
    if (code === 413) {
      return { success: false, error: "Файл слишком большой. Максимум — 512 КБ" };
    }
    if (code === 400) {
      return { success: false, error: "Неподдерживаемый формат. Используйте PNG, JPEG или WebP" };
    }
    return { success: false, error: result.error.message || "Ошибка загрузки аватара" };
  }

  revalidatePath("/profile");
  return { success: true };
}
