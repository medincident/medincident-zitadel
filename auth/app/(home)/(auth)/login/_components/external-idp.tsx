"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { MaxLogoIcon, TelegramLogoIcon } from "@/app/_components/icons";
import { ZitadelIdp } from "@/services/zitadel/api";
import { loginWithProviderAction } from "../actions";
import { Mail } from "lucide-react";

interface AuthButtonProps {
  requestId?: string;
  idpId: string;
}

interface GenericButtonProps extends AuthButtonProps {
  name: string;
}

export const GenericButton = ({ requestId, idpId, name }: GenericButtonProps) => (
  <form action={loginWithProviderAction.bind(null, idpId, requestId)} className="w-full">
    <Button
      type="submit"
      variant="outline"
      size="lg"
      className="w-full relative py-6 text-base group active:scale-[0.98]"
    >
      <span>{name}</span>
    </Button>
  </form>
);

const TelegramButton = ({ requestId, idpId }: AuthButtonProps) => (
  <form action={loginWithProviderAction.bind(null, idpId, requestId)} className="w-full">
    <Button
      type="submit"
      variant="telegram"
      size="lg"
      className="w-full relative py-6 text-base group active:scale-[0.98]"
    >
      <TelegramLogoIcon className="absolute left-4 top-1/2 -translate-y-1/2 transition-transform group-hover:scale-110" />
      <span className="pl-4">Telegram</span>
    </Button>
  </form>
);

const MaxButton = ({ requestId, idpId }: AuthButtonProps) => (
  <form action={loginWithProviderAction.bind(null, idpId, requestId)} className="w-full">
    <Button
      type="submit"
      variant="max"
      size="lg"
      className="w-full relative py-6 text-base group active:scale-[0.98]"
    >
      <MaxLogoIcon className="absolute left-4 top-1/2 -translate-y-1/2 transition-transform group-hover:scale-110" />
      <span className="pl-4">MAX</span>
    </Button>
  </form>
);

const STYLED_PROVIDERS: Record<string, React.FC<AuthButtonProps>> = {
  telegram: TelegramButton,
  max: MaxButton,
};

interface ExternalIdentityProvidersProps {
  requestId?: string;
  providers: ZitadelIdp[];
}

export function ExternalIdentityProviders({ requestId, providers }: ExternalIdentityProvidersProps) {
  const emailHref = requestId ? `/login/email?requestId=${requestId}` : "/login/email";

  return (
    <div className="grid gap-2 md:gap-3">
      {providers && providers.length > 0 && (
        <>
          {providers.map((provider) => {
            const lowerCaseName = provider.name.toLowerCase();
            const StyledProvider = STYLED_PROVIDERS[lowerCaseName];

            if (StyledProvider) {
              return <StyledProvider key={provider.id} requestId={requestId} idpId={provider.id} />;
            }

            return (
              <GenericButton
                key={provider.id}
                requestId={requestId}
                idpId={provider.id}
                name={provider.name}
              />
            );
          })}

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">или</span>
            </div>
          </div>
        </>
      )}

      <Button
        variant="outline"
        size="lg"
        className="w-full relative py-6 text-base active:scale-[0.98]"
        asChild
      >
        <Link href={emailHref}>
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
          <span className="pl-4">Электронная почта</span>
        </Link>
      </Button>
    </div>
  );
}
