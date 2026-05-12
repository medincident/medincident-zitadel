"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  approveDeviceAuthorization,
  getDeviceAuthorization,
} from "@/services/zitadel/api";
import { getSessionCookieById } from "@/services/zitadel/cookies";
import { requireValidSession } from "@/services/zitadel/session";
import { unsealDeviceHint } from "@/services/zitadel/device-context";
import { rateLimit } from "@/shared/lib/rate-limit";

const USER_CODE_RE = /^[A-Z0-9-]{4,16}$/;

async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

export async function approveDeviceAction(userCode: string, hint?: string): Promise<void> {
  if (!userCode || !USER_CODE_RE.test(userCode)) {
    throw new Error("Неверный код устройства");
  }

  const { currentSessionId } = await requireValidSession();

  const rl = rateLimit(`device-approve:${currentSessionId}`, 5, 60_000);
  if (!rl.ok) {
    throw new Error("Слишком много подтверждений. Подождите минуту.");
  }

  const sessionCookie = await getSessionCookieById({ sessionId: currentSessionId });
  if (!sessionCookie?.token) {
    throw new Error("Не найдена сессия");
  }

  const deviceAuthRes = await getDeviceAuthorization(userCode);
  if (!deviceAuthRes.success || !deviceAuthRes.data?.deviceAuthorizationRequest?.id) {
    throw new Error("QR-код недействителен или истёк");
  }

  const deviceAuthRequest = deviceAuthRes.data.deviceAuthorizationRequest;
  const deviceAuthId = deviceAuthRequest.id!;
  const appName: string = (deviceAuthRequest as { appName?: string }).appName || "Приложение";

  const approveRes = await approveDeviceAuthorization(
    deviceAuthId,
    currentSessionId,
    sessionCookie.token,
  );
  if (!approveRes.success) {
    throw new Error("Не удалось подтвердить вход");
  }

  const deviceHint = hint ? await unsealDeviceHint(hint) : null;
  const deviceUa = deviceHint?.browser ?? "";

  const params = new URLSearchParams();
  params.set("app", appName);
  if (deviceUa) params.set("deviceUa", deviceUa);

  redirect(`/device/success?${params.toString()}`);
}

export async function denyDeviceAction(): Promise<void> {
  const { currentSessionId } = await requireValidSession();
  console.log("[device:deny] sessionId=%s, ip=%s", currentSessionId, await clientIp());
  redirect("/profile");
}
