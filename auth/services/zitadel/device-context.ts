"server only";

import { cookies } from "next/headers";
import { CompactEncrypt, compactDecrypt } from "jose";
import { env } from "@/shared/config/env";

export const DEVICE_CTX_COOKIE = "zdc_ctx";

export interface DeviceCtx {
  deviceCode: string;
  userCode: string;
  requestId?: string;
  browser?: string;
  createdAt: number;
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

// applyDeviceFlowAction — через server-side Map с TTL.
export interface DeviceApproval {
  userId: string;
  mfaProven: boolean;
  requestId?: string;
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: number;
  expiresAt: number;
}

interface ApprovalGlobal {
  __zdcApprovals?: Map<string, DeviceApproval>;
}

function approvalStore(): Map<string, DeviceApproval> {
  const g = globalThis as ApprovalGlobal;
  if (!g.__zdcApprovals) {
    g.__zdcApprovals = new Map();
  }
  return g.__zdcApprovals;
}

const APPROVAL_TTL_MS = 30_000;

export function putQrApproval(userCode: string, approval: Omit<DeviceApproval, "expiresAt">): void {
  approvalStore().set(userCode, { ...approval, expiresAt: Date.now() + APPROVAL_TTL_MS });
}

export function takeQrApproval(userCode: string): DeviceApproval | null {
  const store = approvalStore();
  const entry = store.get(userCode);
  if (!entry) return null;
  store.delete(userCode);
  if (entry.expiresAt < Date.now()) return null;
  return entry;
}

export function peekQrApproval(userCode: string): DeviceApproval | null {
  const store = approvalStore();
  const entry = store.get(userCode);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(userCode);
    return null;
  }
  return entry;
}

export function pruneExpiredQrApprovals(): void {
  const store = approvalStore();
  const now = Date.now();
  for (const [code, entry] of store) {
    if (entry.expiresAt < now) store.delete(code);
  }
}
