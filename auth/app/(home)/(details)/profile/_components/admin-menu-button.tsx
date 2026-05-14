import { ExternalLink, Settings } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { isAdminAnywhere } from "@/services/backend";

interface AdminMenuButtonProps {
  variant?: "sidebar" | "mobile";
}

export async function AdminMenuButton({ variant = "sidebar" }: AdminMenuButtonProps) {
  const isAdmin = await isAdminAnywhere();
  if (!isAdmin) return null;

  if (variant === "mobile") {
    return (
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="ml-1 text-muted-foreground hover:text-primary hover:bg-primary/10 font-medium"
      >
        <a href="/ui/console" target="_blank" rel="noopener noreferrer">
          Админизация
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      asChild
      className="group w-full justify-start gap-3 px-3 py-3 h-auto text-muted-foreground rounded-xl font-medium hover:bg-muted hover:text-primary"
    >
      <a href="/ui/console" target="_blank" rel="noopener noreferrer">
        <Settings className="size-5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
        <span className="flex-1 text-left">Админизация</span>
        <ExternalLink className="size-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      </a>
    </Button>
  );
}
