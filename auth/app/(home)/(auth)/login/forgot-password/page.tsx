import { Metadata } from "next";
import { AppLogoIcon } from "@/app/_components/icons";
import { APP_NAME } from "@/shared/lib/constants";
import { ForgotPasswordRequestForm } from "./_components/request-form";
import { requestResetAction } from "./actions";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  description: "Запрос кода для сброса пароля",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string }>;
}) {
  const { requestId } = await searchParams;
  const boundAction = requestResetAction.bind(null, requestId);
  const loginHref = requestId ? `/login/email?requestId=${requestId}` : "/login/email";

  return (
    <div className="h-dvh overflow-y-auto flex flex-col items-center px-4 pt-8 pb-8 sm:pt-16 md:pt-24 bg-background font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="size-14 sm:size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-primary border border-primary/20">
            <AppLogoIcon className="size-7 sm:size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Восстановление пароля
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Введите email вашего аккаунта в {APP_NAME}, и мы отправим вам код подтверждения.
          </p>
        </div>

        <ForgotPasswordRequestForm action={boundAction} loginHref={loginHref} />
      </div>
    </div>
  );
}
