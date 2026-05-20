import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppLogoIcon } from "@/app/_components/icons";
import {
  getRegFlowCookie,
  deleteRegFlowCookie,
  deleteIdpIntentCookie,
  deletePasswordResetCookie,
} from "../../_lib/reg-flow";
import { VerifyForm } from "./_components/verify-form";
import { verifyEmailAction } from "./actions";
import { resendEmailVerification, getUserById } from "@/services/zitadel/api";
import { getUserIdFromNextAuth } from "@/services/zitadel/session";
import { logoutAction } from "../../actions";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string }>;
}) {
  await searchParams;
  const flow = await getRegFlowCookie();

  let userId: string;
  let email: string;

  if (flow?.userId) {
    // Путь регистрации (email или IDP) — данные уже в куке
    userId = flow.userId;
    email = flow.email;
  } else {
    // Путь из профиля — userId из NextAuth (пользователь перенаправлен из ProfileLayout)
    const uid = await getUserIdFromNextAuth();
    if (!uid) redirect("/login");

    userId = uid;

    // Получаем email через Zitadel API по userId
    const userRes = await getUserById(userId);
    email = userRes.success
      ? (userRes.data?.user?.human?.email?.email ?? userRes.data?.user?.preferredLoginName ?? "")
      : "";

    console.log("[auth:verify] Путь из профиля: userId=%s, email=%s", userId, email);

    // Server Component может вызывать API — отправляем код здесь
    await resendEmailVerification(userId);
  }

  async function resendAction() {
    "use server";
    await resendEmailVerification(userId);
  }

  async function backToLoginAction() {
    "use server";
    await deleteRegFlowCookie();
    await deleteIdpIntentCookie();
    await deletePasswordResetCookie();
    await logoutAction();
  }

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 pt-8 pb-8 sm:pt-16 md:pt-24 bg-background font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-4">
          <form action={backToLoginAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-2 -ml-2 h-8 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Вернуться на главную
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="size-14 sm:size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-primary border border-primary/20">
            <AppLogoIcon className="size-7 sm:size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Подтвердите email
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Введите код из письма
          </p>
        </div>

        <VerifyForm
          action={verifyEmailAction}
          resendAction={resendAction}
          email={email}
        />
      </div>
    </div>
  );
}
