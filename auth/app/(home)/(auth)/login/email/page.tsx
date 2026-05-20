import { AppLogoIcon } from "@/app/_components/icons";
import { APP_NAME } from "@/shared/lib/constants";
import { EmailLoginForm } from "./_components/email-login-form";
import { loginWithEmailAction } from "./actions";
import { env } from "@/shared/config/env";
import { BackLink } from "../_components/back-link";

export default async function EmailLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string }>;
}) {
  const { requestId } = await searchParams;
  const boundAction = loginWithEmailAction.bind(null, requestId);

  const registerHref = requestId
    ? `/login/register?source=email&requestId=${requestId}`
    : "/login/register?source=email";

  const forgotPasswordHref = requestId
    ? `/login/forgot-password?requestId=${requestId}`
    : "/login/forgot-password";

  const backHref = requestId 
    ? `/login?requestId=${requestId}`
    : "/login";


      const initialState = env.isDev
        ? { values: { email: "admin@medincident.ru", password: "Password1!" }, errors: {}}
        : { errors: {} }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 md:pt-24 p-4 bg-background font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <BackLink href={backHref} />
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/20">
            <AppLogoIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Вход в {APP_NAME}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Войдите по электронной почте
          </p>
        </div>

        <EmailLoginForm action={boundAction} registerHref={registerHref} forgotPasswordHref={forgotPasswordHref} initialState={initialState} />
      </div>
    </div>
  );
}
