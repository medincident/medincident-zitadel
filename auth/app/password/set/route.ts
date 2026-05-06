import { NextRequest, NextResponse } from "next/server";
import { setPasswordResetCookie } from "@/app/(home)/(auth)/login/_lib/reg-flow";
import { env } from "@/shared/config/env";

// Точка входа по ссылке из письма Zitadel password_reset:
//   /password/set?code=X5GAL0&organization=...&userId=367070315047550982
//
// Кладём userId в reset-cookie и перенаправляем на общий экран сброса пароля
// /login/forgot-password/verify, прокинув code через query-param — там форма
// сама подставит его в CodeInput. Cookie ставим из Route Handler, потому что
// в Server Component при рендере Next.js этого делать не позволяет.
//
// Базируем redirect-URL на env.APP_URL: за reverse-proxy req.url приходит
// с внутренним хостом (0.0.0.0:3000), и редирект ушёл бы пользователю.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const userId = url.searchParams.get("userId") ?? "";
  const requestId = url.searchParams.get("requestId") ?? undefined;

  if (!userId) {
    return NextResponse.redirect(new URL("/login/forgot-password", env.APP_URL));
  }

  await setPasswordResetCookie({ userId, requestId });

  const target = new URL("/login/forgot-password/verify", env.APP_URL);
  if (code) target.searchParams.set("code", code);
  if (requestId) target.searchParams.set("requestId", requestId);
  return NextResponse.redirect(target);
}
