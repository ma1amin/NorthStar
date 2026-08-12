import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

const reasonValues = ["spam", "duplicate", "inaccurate", "malicious", "other"] as const;

export function ReportResourceDialog({ resourceId, isAuthenticated }: { resourceId: number; isAuthenticated: boolean }) {
  const { t } = useLanguage();
  const { startLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof reasonValues)[number]>("inaccurate");
  const [details, setDetails] = useState("");
  const report = trpc.resources.report.useMutation({
    onSuccess: () => { toast.success(t("reportSubmitted")); setOpen(false); setDetails(""); setReason("inaccurate"); },
    onError: (error) => toast.error(error.message || t("unableToSubmitReport")),
  });
  const openReport = () => {
    if (!isAuthenticated) { startLogin(); return; }
    setOpen(true);
  };
  const duplicateDetailsMissing = reason === "duplicate" && details.trim().length < 5;
  const labels = {
    spam: t("spamOrPromotional"), duplicate: t("duplicateResource"), inaccurate: t("inaccurateOrOutdated"), malicious: t("potentiallyMalicious"), other: t("otherQualityConcern"),
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" onClick={openReport}><Flag className="mr-2 h-4 w-4" /> {t("report")}</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{t("reportConcern")}</DialogTitle><DialogDescription>{t("reportExplanation")}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (duplicateDetailsMissing) { toast.error(t("duplicateDetailsRequired")); return; } report.mutate({ resourceId, reason, details: details.trim() || undefined }); }}><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">{t("reportReason")}</span><select value={reason} onChange={(event) => setReason(event.target.value as typeof reason)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">{reasonValues.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">{reason === "duplicate" ? <>{t("suspectedDuplicate")} <span className="text-red-600">*</span></> : <>{t("details")} <span className="font-normal text-slate-500">({t("optional")})</span></>}</span><Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder={reason === "duplicate" ? t("duplicateDetailsPlaceholder") : t("reportDetailsPlaceholder")} maxLength={2000} rows={5} /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button><Button type="submit" disabled={report.isPending || duplicateDetailsMissing} className="bg-sky-600 text-white hover:bg-sky-700">{report.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("submitting")}</> : t("submitReport")}</Button></DialogFooter></form></DialogContent></Dialog>;
}
