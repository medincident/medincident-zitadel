import { redirect } from "next/navigation";
import { AppLogoIcon } from "@/app/_components/icons";
import { getTotpPendingCookie } from "../_lib/reg-flow";
import { TotpForm } from "./_components/totp-form";
import { verifyTotpLoginAction } from "./actions";

export default async function TotpLoginPage() {
  const pending = await getTotpPendingCookie();
  if (!pending) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 md:pt-24 p-4 bg-background font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/20">
            <AppLogoIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Двухфакторная аутентификация (2FA)</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Откройте Google Authenticator
          </p>
        </div>

        <TotpForm action={verifyTotpLoginAction} />
      </div>
    </div>
  );
}
