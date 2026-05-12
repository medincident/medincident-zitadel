import { QrData } from "@/domain/auth/types";
import { env } from "@/shared/config/env";
import { setDeviceCtx, sealDeviceHint } from "@/services/zitadel/device-context";
import { rateLimit, clientKeyFromRequest } from "@/shared/lib/rate-limit";
import { parseUserAgent } from "@/shared/lib/user-agent";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_EXPIRES_IN = 300;

export async function GET(req: NextRequest) {
  const rl = rateLimit(`qr:init:${clientKeyFromRequest(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  try {
    const requestId = req.nextUrl.searchParams.get("requestId") || undefined;
    const browser = parseUserAgent(req.headers.get("user-agent") ?? "");

    const res = await fetch(`${env.ZITADEL_API_URL}/oauth/v2/device_authorization`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.APP_CLIENT_ID,
        // audience-scope обязательна, иначе access_token не принимается /v2/users API
        scope: "openid profile email offline_access urn:zitadel:iam:org:project:id:zitadel:aud",
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("device_authorization error:", await res.text());
      return NextResponse.json({ error: "Ошибка" }, { status: 500 });
    }

    const zitadelData = await res.json();
    const { device_code, user_code, expires_in } = zitadelData;

    const expiresIn = Number(expires_in) || DEFAULT_EXPIRES_IN;

    await setDeviceCtx({
      deviceCode: device_code,
      userCode: user_code,
      requestId,
      browser,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn * 1000,
    });

    const hint = await sealDeviceHint({ browser, createdAt: Date.now() });

    const url =
      `${env.APP_URL}/device` +
      `?user_code=${encodeURIComponent(user_code)}` +
      `&hint=${encodeURIComponent(hint)}`;

    const data: QrData = {
      url,
      token: user_code,
      userCode: user_code,
      expiresInSeconds: expiresIn,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("QR route error:", error);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
