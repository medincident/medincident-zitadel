"use client";

import type { FC } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { MaxLogoIcon, TelegramLogoIcon } from "@/app/_components/icons";
import { ZitadelIdp } from "@/services/zitadel/api";
import { loginWithProviderAction } from "../actions";

const ICON_CLASS = "absolute left-4 top-1/2 -translate-y-1/2 transition-transform group-hover:scale-110";
const BUTTON_CLASS = "w-full relative py-6 text-base group active:scale-[0.98]";

interface AuthButtonProps {
  requestId?: string;
  idpId: string;
}

interface GenericButtonProps extends AuthButtonProps {
  name: string;
}

const GenericButton: FC<GenericButtonProps> = ({ requestId, idpId, name }) => (
  <form action={loginWithProviderAction.bind(null, idpId, requestId)} className="w-full">
    <Button type="submit" variant="outline" size="lg" className={BUTTON_CLASS}>
      <span>{name}</span>
    </Button>
  </form>
);

const TelegramButton: FC<AuthButtonProps> = ({ requestId, idpId }) => (
  <form action={loginWithProviderAction.bind(null, idpId, requestId)} className="w-full">
    <Button type="submit" variant="telegram" size="lg" className={BUTTON_CLASS}>
      <TelegramLogoIcon className={ICON_CLASS} />
      <span className="pl-4">Telegram</span>
    </Button>
  </form>
);

const MaxButton: FC<AuthButtonProps> = ({ requestId, idpId }) => (
  <form action={loginWithProviderAction.bind(null, idpId, requestId)} className="w-full">
    <Button type="submit" variant="max" size="lg" className={BUTTON_CLASS}>
      <MaxLogoIcon className={ICON_CLASS} />
      <span className="pl-4">MAX</span>
    </Button>
  </form>
);

const STYLED_PROVIDERS: Record<string, FC<AuthButtonProps>> = {
  telegram: TelegramButton,
  max: MaxButton,
};

interface ExternalIdentityProvidersProps {
  requestId?: string;
  providers: ZitadelIdp[];
}

export function ExternalIdentityProviders({ requestId, providers }: ExternalIdentityProvidersProps) {
  const emailHref = requestId ? `/login/email?requestId=${requestId}` : "/login/email";
  const hasProviders = providers.length > 0;

  return (
    <div className="grid gap-2 md:gap-3">
      {hasProviders && (
        <>
          {providers.map((provider) => {
            const StyledProvider = STYLED_PROVIDERS[provider.name.toLowerCase()];
            return StyledProvider ? (
              <StyledProvider key={provider.id} requestId={requestId} idpId={provider.id} />
            ) : (
              <GenericButton key={provider.id} requestId={requestId} idpId={provider.id} name={provider.name} />
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

      <Button variant="outline" size="lg" className={BUTTON_CLASS} asChild>
        <Link href={emailHref}>
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5" />
          <span className="pl-4">Электронная почта</span>
        </Link>
      </Button>
    </div>
  );
}
