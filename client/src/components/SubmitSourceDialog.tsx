import { useState } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const sourceTypes = ["official", "documentation", "repository", "community", "archive", "other"] as const;
type SourceType = (typeof sourceTypes)[number];

function sourceTypeLabel(type: SourceType, t: (key: any) => string) {
  const labels: Record<SourceType, string> = {
    official: t("sourceTypeOfficial"),
    documentation: t("sourceTypeDocumentation"),
    repository: t("sourceTypeRepository"),
    community: t("sourceTypeCommunity"),
    archive: t("sourceTypeArchive"),
    other: t("sourceTypeOther"),
  };
  return labels[type];
}

export function SubmitSourceDialog({ resourceId, isAuthenticated }: { resourceId: number; isAuthenticated: boolean }) {
  const { startLogin } = useAuth();
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("official");
  const [attribution, setAttribution] = useState("");
  const [licenseNote, setLicenseNote] = useState("");

  const submitSource = trpc.resources.submitSource.useMutation({
    onSuccess: async () => {
      toast.success(t("sourceSubmitted"));
      setOpen(false);
      setUrl("");
      setSourceType("official");
      setAttribution("");
      setLicenseNote("");
      await utils.resources.getTrustContext.invalidate({ resourceId });
    },
    onError: () => toast.error(t("sourceSubmitError")),
  });

  const requestOpen = (nextOpen: boolean) => {
    if (nextOpen && !isAuthenticated) {
      startLogin();
      return;
    }
    setOpen(nextOpen);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSource.mutate({
      resourceId,
      url: url.trim(),
      sourceType,
      attribution: attribution.trim() || undefined,
      licenseNote: licenseNote.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={requestOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <FilePlus2 className="mr-2 h-4 w-4" /> {t("submitSource")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("submitSource")}</DialogTitle>
          <DialogDescription>{t("submitSourceIntro")}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="source-url">{t("sourceUrl")}</Label>
            <Input id="source-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" required maxLength={2048} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-type">{t("sourceType")}</Label>
            <select id="source-type" value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
              {sourceTypes.map((type) => <option key={type} value={type}>{sourceTypeLabel(type, t)}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-attribution">{t("sourceAttribution")}</Label>
            <Input id="source-attribution" value={attribution} onChange={(event) => setAttribution(event.target.value)} maxLength={500} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-license-note">{t("sourceLicenseNote")}</Label>
            <Textarea id="source-license-note" value={licenseNote} onChange={(event) => setLicenseNote(event.target.value)} rows={3} maxLength={500} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitSource.isPending} className="bg-sky-600 text-white hover:bg-sky-700">
              {submitSource.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("submitting")}</> : t("submitSource")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
