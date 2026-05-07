import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppLogoIcon } from "@/app/_components/icons";
import { APP_NAME } from "@/shared/lib/constants";
import { ResetPasswordForm } from "./_components/reset-form";
import { submitResetAction } from "../actions";
import { getPasswordResetCookie } from "../../_lib/reg-flow";
import { requestPasswordReset } from "@/services/zitadel/api";

export const metadata: Metadata = {
  title: "Новый пароль",
  description: "Введите код из письма и установите новый пароль",
};

export default async function ResetPasswordVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string; code?: string }>;
}) {
  const { requestId, code } = await searchParams;

  // Если cookie сброса нет — флоу нельзя продолжить. Отправляем обратно на запрос кода.
  const flow = await getPasswordResetCookie();
  if (!flow?.userId) {
    const params = new URLSearchParams();
    if (requestId) params.set("requestId", requestId);
    redirect(`/login/forgot-password?${params}`);
  }

  const boundAction = submitResetAction.bind(null, requestId);
  const loginHref = requestId ? `/login/email?requestId=${requestId}` : "/login/email";

  const userId = flow.userId;
  async function resendAction() {
    "use server";
    await requestPasswordReset(userId);
  }

  return (
    <div className="h-dvh overflow-y-auto flex flex-col items-center px-4 pt-8 pb-8 sm:pt-16 md:pt-24 bg-background font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="size-14 sm:size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-primary border border-primary/20">
            <AppLogoIcon className="size-7 sm:size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Новый пароль
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Мы отправили 6-значный код на email вашего аккаунта в {APP_NAME}.
          </p>
        </div>

        <ResetPasswordForm action={boundAction} resendAction={resendAction} loginHref={loginHref} defaultCode={code} />
      </div>
    </div>
  );
}
