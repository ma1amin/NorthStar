import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => { const handler = (event: Event) => { event.preventDefault(); setPromptEvent(event as BeforeInstallPromptEvent); }; window.addEventListener("beforeinstallprompt", handler); return () => window.removeEventListener("beforeinstallprompt", handler); }, []);
  if (!promptEvent) return null;
  return <Button variant="ghost" size="icon" className="hidden text-slate-600 hover:bg-sky-50 hover:text-sky-700 md:inline-flex" aria-label="Install NorthStar" title="Install NorthStar" onClick={async () => { await promptEvent.prompt(); await promptEvent.userChoice; setPromptEvent(null); }}><Download className="h-4 w-4" /></Button>;
}
