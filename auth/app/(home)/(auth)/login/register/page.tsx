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

    const rawInfo = intent.idpInformation?.rawInformation || {};
    const nameString = (rawInfo?.name ?? intent.idpInformation?.userName ?? "").trim();
    const [defaultGivenName = "", ...familyParts] = nameString.split(/\s+/);

    const initialData = {
      givenName: defaultGivenName,
      familyName: familyParts.join(" "),
      middleName: "",
      email: rawInfo?.email ?? "",
    };

    const boundAction = continueRegisterIdp.bind(null, requestId);

    return (
      <div className="min-h-screen flex flex-col items-center justify-start pt-16 md:pt-24 p-4 bg-background font-sans">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/20">
              <AppLogoIcon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Регистрация</h1>
            <p className="text-muted-foreground mt-2 text-sm">Проверьте и заполните ваши данные</p>
          </div>
          <RegisterView action={boundAction} initialData={initialData} />
        </div>
      </div>
    );
  }

  // Email-путь — пустая форма
  const boundAction = continueRegisterEmail.bind(null, requestId);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 md:pt-24 p-4 bg-background font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/20">
            <AppLogoIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Регистрация</h1>
          <p className="text-muted-foreground mt-2 text-sm">Заполните ваши данные</p>
        </div>
        <RegisterView
          action={boundAction}
          initialData={{ givenName: "", familyName: "", middleName: "", email: "" }}
          showPassword
        />
      </div>
    </div>
  );
}
