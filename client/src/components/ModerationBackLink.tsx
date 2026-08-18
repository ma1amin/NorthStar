import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModerationBackLink({ className }: { className?: string }) {
  const [, setLocation] = useLocation();

  return (
    <Button
      type="button"
      onClick={() => setLocation("/admin")}
      className={cn("bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:ring-sky-500", className)}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Moderation dashboard
    </Button>
  );
}
