import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const reasons = [
  ["spam", "Spam or promotional content"],
  ["duplicate", "Duplicate resource"],
  ["inaccurate", "Inaccurate or outdated information"],
  ["malicious", "Potentially malicious destination"],
  ["other", "Other quality concern"],
] as const;

export function ReportResourceDialog({ resourceId, isAuthenticated }: { resourceId: number; isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof reasons)[number][0]>("inaccurate");
  const [details, setDetails] = useState("");
  const report = trpc.resources.report.useMutation({
    onSuccess: () => { toast.success("Report submitted for moderator review"); setOpen(false); setDetails(""); setReason("inaccurate"); },
    onError: (error) => toast.error(error.message || "Unable to submit report"),
  });
  const openReport = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    setOpen(true);
  };
  const duplicateDetailsMissing = reason === "duplicate" && details.trim().length < 5;
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" onClick={openReport}><Flag className="mr-2 h-4 w-4" /> Report</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Report a resource concern</DialogTitle><DialogDescription>Your report is sent to moderators for review. It does not automatically alter this resource.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (duplicateDetailsMissing) { toast.error("Add the suspected duplicate resource name or URL for the moderator."); return; } report.mutate({ resourceId, reason, details: details.trim() || undefined }); }}><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">Reason</span><select value={reason} onChange={(event) => setReason(event.target.value as typeof reason)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">{reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">{reason === "duplicate" ? <>Suspected duplicate <span className="text-red-600">*</span></> : <>Details <span className="font-normal text-slate-500">(optional)</span></>}</span><Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder={reason === "duplicate" ? "Add the duplicate resource’s NorthStar URL, official URL, or name." : "Share enough context for a moderator to assess the concern."} maxLength={2000} rows={5} /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={report.isPending || duplicateDetailsMissing} className="bg-sky-600 text-white hover:bg-sky-700">{report.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting</> : "Submit report"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
