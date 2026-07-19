import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  fallback?: string;
  label?: string;
  className?: string;
};

/**
 * Consistent "Voltar" button for internal pages. Uses browser history when
 * available and falls back to a safe route (default `/dashboard`).
 */
export function BackButton({ fallback = "/dashboard", label = "Voltar", className }: Props) {
  const router = useRouter();
  const handleClick = () => {
    // history.length > 1 means there's somewhere to go back to.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: fallback });
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn("gap-2 text-muted-foreground hover:text-foreground", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
