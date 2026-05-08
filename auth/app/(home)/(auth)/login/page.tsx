import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/shared/ui/card";
import { AppLogoIcon } from "@/app/_components/icons";
import { APP_NAME, PRIVACY_URL, TERMS_URL } from "@/shared/lib/constants";
import { QrAuthSection } from "./_components/qr-auth-section";
import { ExternalIdentityProviders } from "./_components/external-idp";
import { fetchProvidersAction } from "./actions";
import { completeAuthRequest, getAuthRequest } from "@/services/zitadel/api";
import { syncSessionCookies } from "@/services/zitadel/sync-sessions";
import { getPreferredSessionId } from "@/services/zitadel/cookies";

export const metadata: Metadata = {
  title: "Вход",
  description: "Авторизация в системе",
};

async function ProviderButtons({ requestId }: { requestId: string }) {
  const providers = await fetchProvidersAction();
  return <ExternalIdentityProviders providers={providers} requestId={requestId} />;
}

export default async function LoginPage({ searchParams }: { searchParams: any }) {
  const resolvedSearchParams = await searchParams;

  const requestId = resolvedSearchParams.requestId || resolvedSearchParams.authRequest;
  const isAddNew = resolvedSearchParams.account === "new";

  if (!requestId) {
    redirect("/profile");
  }

  // Проверка OIDC request содержит prompt=select_account
  let forceSelectAccount = false;
  const authReqResult = await getAuthRequest(requestId);
  if (authReqResult.success) {
    const prompts = authReqResult.data.authRequest?.prompt || [];
    forceSelectAccount = prompts.some((p: string) =>
      p === "PROMPT_SELECT_ACCOUNT" || p === "select_account"
    );
  }

  if (forceSelectAccount) {
    redirect(`/?requestId=${requestId}`);
  }

  // Сверяем cookies с Zitadel — отсеиваем протухшие/удалённые сессии
  const synced = await syncSessionCookies();
  const validSessions = synced.filter(
    ({ cookie, zitadel }) => cookie.token && zitadel?.factors?.user
  );

  // Preferred session: пользователь выбрал аккаунт на странице выбора,
  // клиент запустил свежий signIn() → Zitadel создал новый auth request → мы здесь.
  // Auto-completим с выбранной сессией — PKCE cookies свежие, callbackUrl совпадёт.
  const preferredSessionId = await getPreferredSessionId();
  if (preferredSessionId && !isAddNew) {
    const preferred = synced.find(({ cookie }) => cookie.id === preferredSessionId);
    if (preferred?.cookie.token) {
      console.log("[login] Preferred session: sessionId=%s, requestId=%s", preferred.cookie.id, requestId);
      const result = await completeAuthRequest(requestId, preferred.cookie.id, preferred.cookie.token);
      if (result.success) {
        const callbackUrl = result.data.callbackUrl || result.data.url;
        console.log("[login] Preferred session OK, callbackUrl=%s", callbackUrl);
        redirect(callbackUrl || "/profile");
      }
      console.error("[login] Preferred session FAILED:", JSON.stringify(result.error));
    }
  }

  if (validSessions.length >= 1 && !isAddNew) {
    redirect(`/?requestId=${requestId}`);
  }

  return (
    <main className="h-dvh overflow-y-auto overflow-x-hidden w-full flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-[960px] overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-in fade-in duration-500">
        {/* LEFT COLUMN */}
        <div className="hidden md:flex relative flex-col items-center justify-center text-center p-12 overflow-hidden border-r border-border bg-primary/5">
          <div className="absolute -top-[40%] -left-[40%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-[40%] -right-[50%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-xl pointer-events-none" />
          <Suspense>
            <QrAuthSection requestId={requestId} />
          </Suspense>
        </div>

        {/* RIGHT COLUMN */}
        <CardContent className="p-6 sm:p-8 md:p-12 flex flex-col justify-center min-h-[450px] md:min-h-auto">
          <div className="flex flex-col items-center md:items-start mb-6 md:mb-8">
            <div className="size-12 md:size-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-primary border border-primary/20">
              <AppLogoIcon className="size-6 md:size-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center md:text-left">
              Вход в {APP_NAME}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base text-center md:text-left">
              Единый аккаунт для всех медицинских сервисов
            </p>
          </div>

          <div className="space-y-4 md:space-y-6">
            <ProviderButtons requestId={requestId} />
          </div>

          <p className="mt-6 md:mt-8 text-center text-xs text-muted-foreground leading-relaxed">
            Нажимая на кнопки входа, вы принимаете{" "}
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-primary font-medium transition-colors hover:underline">
              пользовательское соглашение
            </a>{" "}
            и{" "}
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-primary font-medium transition-colors hover:underline">
              политику конфиденциальности
            </a>{" "}
            сервиса {APP_NAME}.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
