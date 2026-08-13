import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, FileText, Link2, Loader2, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const SUPPORTED_EXTENSIONS = ["txt", "md", "csv", "json"];
const MAX_FILE_BYTES = 300_000;

function inputTypeFor(name?: string, text?: string) {
  if (name) return "text_export" as const;
  const links = text?.match(/https?:\/\//gi)?.length ?? 0;
  return links > 1 && text?.trim().split(/\s+/).length === links ? "links" as const : "pasted_text" as const;
}

export default function CaptureResources() {
  const { isAuthenticated, startLogin } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [inputName, setInputName] = useState<string | undefined>();
  const [consent, setConsent] = useState(false);
  const [retentionMode, setRetentionMode] = useState<"minimized" | "review_evidence">("minimized");
  const [intakeId, setIntakeId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const createMutation = trpc.intake.create.useMutation({
    onSuccess: async (result) => {
      setIntakeId(result.intakeId);
      setNotice("");
      setError("");
      await utils.intake.list.invalidate();
    },
    onError: (nextError) => setError(nextError.message || t("noSafeLinks")),
  });
  const submitMutation = trpc.intake.submit.useMutation({
    onSuccess: async () => {
      setNotice(t("intakeSubmitted"));
      await utils.intake.get.invalidate();
      await utils.intake.list.invalidate();
    },
    onError: (nextError) => setError(nextError.message),
  });
  const allowanceQuery = trpc.intake.allowance.useQuery(undefined, { enabled: isAuthenticated });
  const intakeQuery = trpc.intake.get.useQuery({ intakeId: intakeId ?? 0 }, { enabled: intakeId !== null });

  const canCreate = useMemo(() => Boolean(text.trim() && consent && !createMutation.isPending), [text, consent, createMutation.isPending]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !SUPPORTED_EXTENSIONS.includes(extension) || file.size > MAX_FILE_BYTES) {
      setError("Choose a text, Markdown, CSV, or JSON file smaller than 300 KB.");
      return;
    }
    setText(await file.text());
    setInputName(file.name);
    setError("");
    setIntakeId(null);
  };

  const handleCreate = () => {
    if (!isAuthenticated) return startLogin();
    if (!canCreate) return;
    createMutation.mutate({ text, inputType: inputTypeFor(inputName, text), inputName, retentionMode, consentConfirmed: true });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    void handleFile(event.dataTransfer.files?.[0]);
  };

  const intake = intakeQuery.data?.intake;
  const candidates = intakeQuery.data?.candidates ?? [];
  const submitted = intake?.status === "submitted";

  return <div className="ns-noise min-h-[calc(100vh-4rem)] py-10 sm:py-14">
    <div className="container max-w-5xl">
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_85%_10%,rgba(125,211,252,.45),transparent_28%),radial-gradient(circle_at_15%_80%,rgba(196,181,253,.34),transparent_30%),white] p-7 shadow-[0_24px_60px_rgba(14,116,144,.10)] sm:p-10">
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-sky-700"><Sparkles className="h-3.5 w-3.5" />{t("communityContribution")}</div>
          <h1 className="font-['Sora'] text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{t("captureResources")}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{t("captureIntro")}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm"><Link2 className="mr-1 inline h-3.5 w-3.5 text-sky-600" />Links</span><span className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm"><FileText className="mr-1 inline h-3.5 w-3.5 text-violet-600" />Exports</span><span className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />Human review</span></div>
        </div>
      </section>

      {!isAuthenticated ? <Card className="ns-surface mt-6 border-slate-200 p-6 text-center"><p className="text-slate-600">{t("signInToContribute")}</p><Button className="ns-primary-button mt-4" onClick={() => startLogin()}>{t("signIn")}</Button></Card> : <div className="mt-6 grid gap-6 lg:grid-cols-[1.28fr_.72fr]">
        <Card className="ns-surface border-slate-200 p-5 sm:p-7">
          <div onDrop={handleDrop} onDragOver={(event) => event.preventDefault()} onClick={() => fileInput.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }} className="group cursor-pointer rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/55 p-6 text-center transition-all duration-200 hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5"><Upload className="h-5 w-5" /></div>
            <p className="mt-3 font-semibold text-slate-900">{t("dropOrPaste")}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t("supportedInput")}</p>
            <Button type="button" variant="outline" className="mt-4 border-sky-200 bg-white text-sky-700" onClick={(event) => { event.stopPropagation(); fileInput.current?.click(); }}>{t("chooseTextFile")}</Button>
            <Input ref={fileInput} className="hidden" type="file" accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json" onChange={(event) => void handleFile(event.target.files?.[0])} />
          </div>
          <div className="mt-5"><Textarea value={text} onChange={(event) => { setText(event.target.value); setIntakeId(null); }} placeholder="https://example.com\n\nPaste a link list, a helpful message, or selected exported chat text…" className="min-h-56 resize-y border-slate-200 bg-white text-slate-800" maxLength={25000} /></div>
          {inputName && <p className="mt-2 text-xs font-medium text-slate-500">{inputName}</p>}
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600" /><span>{t("inputConsent")}</span></label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setRetentionMode("minimized")} className={`rounded-xl border p-4 text-start transition ${retentionMode === "minimized" ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"}`}><p className="font-semibold text-slate-900">{t("minimizedRetention")}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t("minimizedRetentionHelp")}</p></button><button type="button" onClick={() => setRetentionMode("review_evidence")} className={`rounded-xl border p-4 text-start transition ${retentionMode === "review_evidence" ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"}`}><p className="font-semibold text-slate-900">{t("reviewEvidenceRetention")}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t("reviewEvidenceRetentionHelp")}</p></button></div>
          {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
          <Button className="mt-5 w-full bg-slate-950 text-white hover:bg-slate-800" disabled={!canCreate} onClick={handleCreate}>{createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("extractionInProgress")}</> : <><Sparkles className="mr-2 h-4 w-4" />{t("createDrafts")}</>}</Button>
        </Card>
        <aside className="space-y-5"><Card className="ns-surface border-slate-200 p-5"><ShieldCheck className="h-6 w-6 text-emerald-600" /><h2 className="mt-3 font-['Sora'] text-xl font-bold text-slate-950">{t("contributionReview")}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your material produces private drafts. You choose when to submit; a human moderator decides every public change.</p></Card><Card className="ns-surface border-sky-100 bg-sky-50/40 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-sky-700">{t("captureAllowance")}</p><h2 className="mt-2 font-['Sora'] text-3xl font-bold text-slate-950">{allowanceQuery.isLoading ? <Loader2 className="h-6 w-6 animate-spin text-sky-600" /> : allowanceQuery.data?.remaining ?? "—"}</h2><p className="mt-1 text-sm text-slate-600">{t("captureRemaining")}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${allowanceQuery.data?.verified ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{allowanceQuery.data?.verified ? t("captureAllowanceVerified") : t("captureAllowanceStandard")}</span></div><p className="mt-4 text-xs leading-5 text-slate-500">{allowanceQuery.data ? `${allowanceQuery.data.used} / ${allowanceQuery.data.limit}` : ""}</p></Card><Card className="ns-surface border-violet-100 bg-violet-50/40 p-5"><Sparkles className="h-6 w-6 text-violet-600" /><h2 className="mt-3 font-['Sora'] text-xl font-bold text-slate-950">{t("verifiedContributor")}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t("contributorBenefits")}</p><Button variant="outline" className="mt-4 border-violet-200 bg-white text-violet-700" onClick={() => navigate("/profile")}>{t("verification")}</Button></Card></aside>
      </div>}

      {intakeId !== null && <Card className="ns-surface mt-6 border-slate-200 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-['Sora'] text-2xl font-bold text-slate-950">{t("candidateDrafts")}</h2><p className="mt-1 text-sm text-slate-600">{t("candidateDraftsHelp")}</p></div>{intake && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">{t("intakeStatus")}: {intake.status.replaceAll("_", " ")}</span>}</div>{intakeQuery.isLoading ? <div className="py-10 text-center text-slate-500"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{candidates.map((candidate) => <div key={candidate.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-700"><Link2 className="h-3.5 w-3.5" />{candidate.candidateType}</div><p className="mt-2 truncate font-semibold text-slate-900">{candidate.title || candidate.url}</p><p className="mt-1 truncate text-sm text-slate-500">{candidate.url}</p></div>)}</div>}{notice && <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />{notice}</p>}{!submitted && candidates.length > 0 && <Button className="mt-5 bg-sky-600 text-white hover:bg-sky-700" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate({ intakeId })}>{submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{t("submitToModeration")}</Button>}</Card>}
    </div>
  </div>;
}
