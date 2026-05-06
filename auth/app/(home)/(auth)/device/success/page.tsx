import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AppLogoIcon } from "@/app/_components/icons";
import { Button } from "@/shared/ui/button";

export default function DeviceSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm text-center">
        <AppLogoIcon className="h-10 w-10" />

        <CheckCircle2 className="h-16 w-16 text-success" />

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Вход подтверждён
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Вы разрешили вход на другом устройстве.
            <br />
            Можно закрыть эту вкладку.
          </p>
        </div>

        <Button asChild variant="ghost" size="md">
          <Link href="/profile">Вернуться в профиль</Link>
        </Button>
      </div>
    </div>
  );
}
