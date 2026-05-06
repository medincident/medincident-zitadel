import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { APP_NAME } from "@/shared/lib/constants";
import { LEGAL_DOCS, type LegalDocKey } from "./_content";

interface Params {
  searchParams: Promise<{ doc?: string }>;
}

const TITLES: Record<LegalDocKey, string> = {
  terms: "Пользовательское соглашение",
  privacy: "Политика конфиденциальности",
  consent: "Согласие на обработку персональных данных",
};

function isLegalDoc(value: string | undefined): value is LegalDocKey {
  return value === "terms" || value === "privacy" || value === "consent";
}

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { doc } = await searchParams;
  const key = isLegalDoc(doc) ? doc : "terms";
  return {
    title: `${TITLES[key]} — ${APP_NAME}`,
    description: `${TITLES[key]} сервиса ${APP_NAME}`,
  };
}

export default async function LegalPage({ searchParams }: Params) {
  const { doc } = await searchParams;
  if (!doc) {
    // Без аргумента — редирект на terms по умолчанию.
    return <LegalContent docKey="terms" />;
  }
  if (!isLegalDoc(doc)) notFound();
  return <LegalContent docKey={doc} />;
}

function LegalContent({ docKey }: { docKey: LegalDocKey }) {
  const Doc = LEGAL_DOCS[docKey];
  return (
    <>
      <nav className="not-prose mb-8 flex gap-2 flex-wrap text-sm">
        {(Object.keys(TITLES) as LegalDocKey[]).map((k) => (
          <Link
            key={k}
            href={`/legal?doc=${k}`}
            className={
              k === docKey
                ? "px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium"
                : "px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            }
          >
            {TITLES[k]}
          </Link>
        ))}
      </nav>
      <Doc />
    </>
  );
}
