"server only";

import { cookies } from "next/headers";
import { CompactEncrypt, compactDecrypt } from "jose";
import { env } from "@/shared/config/env";

// Контекст Device Flow хранится в HttpOnly encrypted cookie — не в in-memory map.
// Это позволяет пережить перезапуск, HMR и горизонтальное масштабирование.
// Шифруется JWE (A256GCM) на SHA-256 от ZITADEL_SECRET.

export const DEVICE_CTX_COOKIE = "zdc_ctx";
export const DEVICE_TOKENS_COOKIE = "zdc_tokens";

export interface DeviceCtx {
  deviceCode: string;
  userCode: string;
  nonce: string;
  requestId?: string;
  browser?: string;
  createdAt: number;
  expiresAt: number;
}

export interface DeviceTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  nonce: string;
  expiresAt: number;
}

let keyPromise: Promise<Uint8Array> | null = null;
function getKey(): Promise<Uint8Array> {
  if (!keyPromise) {
    keyPromise = crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(env.ZITADEL_SECRET))
      .then((buf) => new Uint8Array(buf));
  }
  return keyPromise;
}

async function seal<T>(data: T): Promise<string> {
  const key = await getKey();
  const payload = new TextEncoder().encode(JSON.stringify(data));
  return new CompactEncrypt(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(key);
}

async function unseal<T>(token: string): Promise<T | null> {
  try {
    const key = await getKey();
    const { plaintext } = await compactDecrypt(token, key);
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return null;
  }
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function setDeviceCtx(ctx: DeviceCtx): Promise<void> {
  const sealed = await seal(ctx);
  const cookiesList = await cookies();
  const maxAge = Math.max(1, Math.floor((ctx.expiresAt - Date.now()) / 1000));
  cookiesList.set({
    name: DEVICE_CTX_COOKIE,
    value: sealed,
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export async function getDeviceCtx(): Promise<DeviceCtx | null> {
  const cookiesList = await cookies();
  const raw = cookiesList.get(DEVICE_CTX_COOKIE)?.value;
  if (!raw) return null;
  const ctx = await unseal<DeviceCtx>(raw);
  if (!ctx) return null;
  if (ctx.expiresAt < Date.now()) return null;
  return ctx;
}

export async function clearDeviceCtx(): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.delete(DEVICE_CTX_COOKIE);
}

export async function setDeviceTokens(tokens: DeviceTokens): Promise<void> {
  const sealed = await seal(tokens);
  const cookiesList = await cookies();
  const maxAge = Math.max(1, Math.floor((tokens.expiresAt - Date.now()) / 1000));
  cookiesList.set({
    name: DEVICE_TOKENS_COOKIE,
    value: sealed,
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export async function getDeviceTokens(): Promise<DeviceTokens | null> {
  const cookiesList = await cookies();
  const raw = cookiesList.get(DEVICE_TOKENS_COOKIE)?.value;
  if (!raw) return null;
  const tokens = await unseal<DeviceTokens>(raw);
  if (!tokens) return null;
  if (tokens.expiresAt < Date.now()) return null;
  return tokens;
}

export async function clearDeviceTokens(): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.delete(DEVICE_TOKENS_COOKIE);
}

// Device hint — публичная метадата Device A (browser/os), передаётся в QR URL.
// Шифруется тем же secret, но предназначена для чтения на /device странице
// (уже на Device B). Не содержит device_code или других секретов.

export interface DeviceHint {
  browser: string;
  createdAt: number;
}

export async function sealDeviceHint(hint: DeviceHint): Promise<string> {
  return seal(hint);
}

export async function unsealDeviceHint(token: string): Promise<DeviceHint | null> {
  return unseal<DeviceHint>(token);
}
