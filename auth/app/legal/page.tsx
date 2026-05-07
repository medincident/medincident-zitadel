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
  consent: "Согласие на обработку ПДн",
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
    return <LegalContent docKey="terms" />;
  }
  if (!isLegalDoc(doc)) notFound();
  return <LegalContent docKey={doc} />;
}

function LegalContent({ docKey }: { docKey: LegalDocKey }) {
  const Doc = LEGAL_DOCS[docKey];
  return (
    <div className="space-y-5 sm:space-y-6">
      <nav aria-label="Юридические документы">
        <ul className="not-prose flex gap-1.5 sm:gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none text-xs sm:text-sm">
          {(Object.keys(TITLES) as LegalDocKey[]).map((k) => {
            const active = k === docKey;
            return (
              <li key={k} className="shrink-0">
                <Link
                  href={`/legal?doc=${k}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    "block whitespace-nowrap px-3 py-2 rounded-md border transition-colors " +
                    (active
                      ? "bg-primary/10 text-primary border-primary/20 font-medium"
                      : "text-muted-foreground hover:text-foreground border-transparent hover:border-border hover:bg-foreground/5")
                  }
                >
                  {TITLES[k]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section
        key={docKey}
        className={[
          "min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300",
          "rounded-2xl border border-border bg-card shadow-sm",
          "px-5 sm:px-8 md:px-12 py-6 sm:py-10 md:py-12",
          "prose prose-sm md:prose-base max-w-none dark:prose-invert",
          "prose-headings:scroll-mt-4",
          "prose-h1:text-2xl prose-h1:sm:text-3xl prose-h1:font-bold prose-h1:tracking-tight prose-h1:mt-0",
          "prose-h2:text-base prose-h2:sm:text-lg prose-h2:font-semibold prose-h2:tracking-tight",
          "prose-h2:mt-8 prose-h2:mb-3 prose-h2:pl-3 prose-h2:border-l-2 prose-h2:border-primary/40",
          "prose-p:leading-relaxed prose-p:text-foreground/90",
          "prose-li:my-1 prose-ul:my-3 prose-ol:my-3",
          "prose-strong:text-foreground",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-code:rounded prose-code:bg-foreground/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        ].join(" ")}
      >
        <Doc />
      </section>
    </div>
  );
}
