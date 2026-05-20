import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  href: string;
  label?: string;
}

export function BackLink({ href, label = "Вернуться" }: Props) {
  return (
    <div className="mb-4">
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 px-2 -ml-2 h-8 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {label}
      </Link>
    </div>
  );
}
