import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModerationBackLink({ className }: { className?: string }) {
  const [, setLocation] = useLocation();

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => setLocation("/admin")}
      className={cn("-ml-3 text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800", className)}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Moderation dashboard
    </Button>
  );
}
