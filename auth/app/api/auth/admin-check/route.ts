import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/services/zitadel/user/auth";
import { isAdminAnywhere } from "@/services/backend";

// Эндпоинт для Traefik ForwardAuth-middleware на `/ui/console`.
// Traefik ставит запрос на паузу и делает подзапрос с пробрасыванием куки, так что auth должен работать
//
// Поведение:
//   - 200 → ForwardAuth пропускает запрос дальше (на zitadel-api).
//   - 302 /login → Traefik форвардит редирект клиенту.
//
// `X-Forwarded-Uri` превращается в `?from=` чтобы после логина вернуть юзера на ту же страницу.
export async function GET(req: NextRequest) {
  const session = await auth();

  const forwardedHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  const forwardedUri = req.headers.get("x-forwarded-uri") ?? "/";
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(req.url).origin;

  const loginUrl = new URL("/login", origin);
  if (forwardedUri && forwardedUri !== "/") loginUrl.searchParams.set("from", forwardedUri);

  if (!session) {
    console.log("[admin-check] no session → /login uri=%s", forwardedUri);
    return NextResponse.redirect(loginUrl, 302);
  }

  const allowed = await isAdminAnywhere().catch((e) => {
    console.error("[admin-check] isAdminAnywhere threw:", e);
    return false;
  });

  if (!allowed) {
    console.log("[admin-check] not admin → /login uri=%s", forwardedUri);
    return NextResponse.redirect(loginUrl, 302);
  }

  console.log("[admin-check] ok uri=%s", forwardedUri);
  return new NextResponse(null, { status: 200 });
}
