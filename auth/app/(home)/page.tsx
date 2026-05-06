import { redirect } from "next/navigation";
import { getAuthRequest } from "@/services/zitadel/api";
import { AccountSelectionContainer } from "./_components/account-selection-container";

export default async function AccountSelectionPage({ searchParams }: { searchParams: any }) {
  const resolvedSearchParams = await searchParams;
  const requestId = resolvedSearchParams.requestId || resolvedSearchParams.authRequest;

  if (!requestId) {
    redirect("/profile");
  }

  const authReqResult = await getAuthRequest(requestId);
  if (!authReqResult.success) {
    console.log("[account-selection] Невалидный requestId=%s, редирект на /profile", requestId);
    redirect("/profile");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background/50">
      <AccountSelectionContainer requestId={requestId} />
    </div>
  );
}
