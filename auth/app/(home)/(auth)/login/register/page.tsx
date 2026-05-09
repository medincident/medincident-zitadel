import { redirect } from "next/navigation";
import { AppLogoIcon } from "@/app/_components/icons";
import { RegisterView } from "./_components/register-view";
import { continueRegisterIdp, continueRegisterEmail } from "./register-actions";
import { getIdpIntentCookie } from "../_lib/reg-flow";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; requestId?: string }>;
}) {
  const { source, requestId } = await searchParams;

  // Для IDP-пути читаем intent из cookie
  if (source === "idp") {
    const intent = await getIdpIntentCookie();

    if (!intent) {
      // Cookie протухла или отсутствует — отправляем на login
      redirect("/login");
    }

    const initialData = {
      givenName: intent.prefill.givenName ?? "",
      familyName: intent.prefill.familyName ?? "",
      middleName: "",
      email: intent.prefill.email ?? "",
    };

    const boundAction = continueRegisterIdp.bind(null, requestId);

    return (
      <div className="h-dvh overflow-y-auto bg-background font-sans">
        <div className="min-h-full flex items-center justify-center px-4 py-6 sm:py-8">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
            <h1 className="mb-6 sm:mb-8 flex items-center justify-center gap-2 text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              <AppLogoIcon className="size-5 md:size-6 text-primary shrink-0" />
              Регистрация
            </h1>
            <RegisterView action={boundAction} initialData={initialData} />
          </div>
        </div>
      </div>
    );
  }

  // Email-путь — пустая форма
  const boundAction = continueRegisterEmail.bind(null, requestId);

  return (
    <div className="h-dvh overflow-y-auto bg-background font-sans">
      <div className="min-h-full flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <h1 className="mb-6 sm:mb-8 flex items-center justify-center gap-2 text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            <AppLogoIcon className="size-5 md:size-6 text-primary shrink-0" />
            Регистрация
          </h1>
          <RegisterView
            action={boundAction}
            initialData={{ givenName: "", familyName: "", middleName: "", email: "" }}
            showPassword
          />
        </div>
      </div>
    </div>
  );
}
