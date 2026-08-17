import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

interface FormData {
  title: string;
  description: string;
  url: string;
  categoryId: string;
  subcategoryId: string;
  pricing: "free" | "freemium" | "paid" | "open_source" | "enterprise";
  license: string;
  builtBy: string;
  builtByUrl: string;
  tags: string;
}

type SuggestedRelationship = {
  targetId: number;
  type: "alternative_to" | "similar_to" | "integrates_with" | "built_by" | "maintained_by" | "funded_by" | "used_by" | "depends_on" | "part_of" | "competitor_of";
  evidenceUrl?: string;
  rationale?: string;
  sourceContext?: string;
};

type EphemeralImportSummary = {
  candidates: string[];
  totalUrlMentions: number;
  rejectedUrlMentions: number;
  personalDataRetained: false;
  sourceContextRetained: false;
  requiresLocalOcr: boolean;
};

function extractBrowserSafeUrls(text: string) {
  const candidates = new Set<string>();
  let rejected = 0;
  for (const raw of text.match(/https?:\/\/[^\s<>"'`()[\]{}]+/gi) ?? []) {
    try {
      const parsed = new URL(raw.replace(/[.,;:!?]+$/g, ""));
      const decoded = decodeURIComponent(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(decoded)) {
        rejected += 1;
      } else {
        parsed.hash = "";
        candidates.add(parsed.toString());
      }
    } catch {
      rejected += 1;
    }
  }
  return { candidates: Array.from(candidates), rejected };
}

const RELATIONSHIP_TYPES = [
  { value: "alternative_to", label: "Alternative To" },
  { value: "similar_to", label: "Similar To" },
  { value: "integrates_with", label: "Integrates With" },
  { value: "built_by", label: "Built By" },
  { value: "maintained_by", label: "Maintained By" },
  { value: "funded_by", label: "Funded By" },
  { value: "used_by", label: "Used By" },
  { value: "depends_on", label: "Depends On" },
  { value: "part_of", label: "Part Of" },
  { value: "competitor_of", label: "Competitor Of" },
] as const;

export default function Submit() {
  const { isAuthenticated, startLogin } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    url: "",
    categoryId: "",
    subcategoryId: "",
    pricing: "free",
    license: "",
    builtBy: "",
    builtByUrl: "",
    tags: "",
  });
  const [relationSearch, setRelationSearch] = useState("");
  const [relationType, setRelationType] = useState<SuggestedRelationship["type"]>("alternative_to");
  const [relationshipEvidenceUrl, setRelationshipEvidenceUrl] = useState("");
  const [relationshipRationale, setRelationshipRationale] = useState("");
  const [relationshipSourceContext, setRelationshipSourceContext] = useState("");
  const [suggestedRelationships, setSuggestedRelationships] = useState<SuggestedRelationship[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [metadataApplied, setMetadataApplied] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [importSummary, setImportSummary] = useState<EphemeralImportSummary | null>(null);
  const [importError, setImportError] = useState("");
  const relationshipLabels: Record<SuggestedRelationship["type"], string> = {
    alternative_to: t("alternativeTo"), similar_to: t("similarTo"), integrates_with: t("integratesWith"), built_by: t("builtBy"), maintained_by: t("maintainedBy"), funded_by: t("fundedBy"), used_by: t("usedBy"), depends_on: t("dependsOn"), part_of: t("partOf"), competitor_of: t("competitorOf"),
  };

  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: archiveHistory = [] } = trpc.archiveIntake.contributorHistory.useQuery({ limit: 10 }, { enabled: isAuthenticated });
  const categoryId = formData.categoryId ? Number(formData.categoryId) : undefined;
  const { data: subcategories = [] } = trpc.categories.getSubcategories.useQuery(
    { categoryId: categoryId ?? 0 },
    { enabled: categoryId !== undefined }
  );

  const isUrlValid = useMemo(() => {
    try {
      const parsed = new URL(formData.url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, [formData.url]);
  const urlInput = useMemo(() => ({ url: formData.url }), [formData.url]);
  const titleInput = useMemo(
    () => ({ title: formData.title.trim(), categoryId: categoryId ?? 0 }),
    [formData.title, categoryId]
  );

  const { data: metadata, isFetching: metadataLoading, error: metadataError } = trpc.resources.previewMetadata.useQuery(urlInput, {
    enabled: isUrlValid,
    retry: false,
  });
  const { data: duplicateByUrl, isFetching: urlDuplicateLoading } = trpc.resources.checkDuplicateByUrl.useQuery(urlInput, {
    enabled: isUrlValid,
  });
  const { data: duplicateByTitle = [], isFetching: titleDuplicateLoading } = trpc.resources.checkDuplicateByTitle.useQuery(titleInput, {
    enabled: Boolean(categoryId && formData.title.trim().length >= 3),
  });

  const relationshipInput = useMemo(
    () => ({ limit: 6, offset: 0, query: relationSearch.trim(), sort: "popular" as const }),
    [relationSearch]
  );
  const { data: relationshipResults } = trpc.resources.listFiltered.useQuery(relationshipInput, {
    enabled: relationSearch.trim().length >= 2,
  });

  const submitMutation = trpc.resources.submitResource.useMutation({
    onSuccess: () => {
      setSubmitSuccess(true);
      setSubmitError("");
    },
    onError: (error) => setSubmitError(error.message || t("failedToSubmitResource")),
  });
  const parseArtifactMutation = trpc.archiveIntake.parseEphemeral.useMutation({
    onError: (error) => setImportError(error.message || "Unable to extract resource links from this file."),
  });

  useEffect(() => {
    if (!metadata || metadataApplied) return;
    setFormData((current) => ({
      ...current,
      title: current.title || metadata.title || "",
      description: current.description || metadata.description || "",
    }));
    setMetadataApplied(true);
  }, [metadata, metadataApplied]);

  useEffect(() => {
    setMetadataApplied(false);
  }, [formData.url]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setSubmitError("");
  };

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result.split(",")[1] : undefined;
      if (!value) reject(new Error("The selected file could not be read."));
      else resolve(value);
    };
    reader.readAsDataURL(file);
  });

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    setImportError("");
    setImportSummary(null);
    if (file.size > 8 * 1024 * 1024) {
      setImportError("This file exceeds the 8 MB privacy-safe processing limit.");
      return;
    }
    try {
      if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng+ara");
        try {
          const result = await worker.recognize(file);
          const urls = extractBrowserSafeUrls(result.data.text);
          setImportSummary({ candidates: urls.candidates, totalUrlMentions: urls.candidates.length + urls.rejected, rejectedUrlMentions: urls.rejected, sourceContextRetained: false, personalDataRetained: false, requiresLocalOcr: false });
        } finally {
          await worker.terminate();
        }
        return;
      }
      const base64 = await fileToBase64(file);
      const result = await parseArtifactMutation.mutateAsync({ filename: file.name, mimeType: file.type || undefined, base64 });
      setImportSummary(result);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to extract resource links from this file.");
    }
  };

  const useImportedCandidate = (url: string) => {
    updateField("url", url);
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicateCandidates = [duplicateByUrl, ...duplicateByTitle];
  const duplicateResources = duplicateCandidates
    .filter((resource, index, all): resource is NonNullable<typeof resource> =>
      Boolean(resource) && all.findIndex((item) => item?.id === resource?.id) === index
    )
    .map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      slug: "slug" in resource ? resource.slug : undefined,
      duplicateType: "duplicateType" in resource ? resource.duplicateType : "published_resource" as const,
    }));
  const isDuplicateChecking = metadataLoading || urlDuplicateLoading || titleDuplicateLoading;
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const selectedSubcategory = subcategories.find((subcategory) => subcategory.id === Number(formData.subcategoryId));

  const addSuggestedRelationship = (targetId: number) => {
    if (suggestedRelationships.some((item) => item.targetId === targetId && item.type === relationType)) return;
    setSuggestedRelationships((current) => [...current, {
      targetId,
      type: relationType,
      evidenceUrl: relationshipEvidenceUrl.trim() || undefined,
      rationale: relationshipRationale.trim() || undefined,
      sourceContext: relationshipSourceContext.trim() || undefined,
    }]);
    setRelationSearch("");
    setRelationshipEvidenceUrl(""); setRelationshipRationale(""); setRelationshipSourceContext("");
  };

  const validateSubmission = () => {
    if (!formData.title.trim() || !isUrlValid || !categoryId) {
      setSubmitError(t("validSubmissionRequired"));
      return false;
    }
    if (duplicateResources.length > 0) {
      setSubmitError(t("reviewPossibleDuplicates"));
      return false;
    }
    return true;
  };

  const handlePreview = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (validateSubmission()) setShowPreview(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!validateSubmission() || !categoryId) return;

    await submitMutation.mutateAsync({
      title: formData.title.trim(),
      url: formData.url.trim(),
      description: formData.description.trim() || undefined,
      categoryId,
      subcategoryId: formData.subcategoryId ? Number(formData.subcategoryId) : undefined,
      pricing: formData.pricing,
      license: formData.license.trim() || undefined,
      builtBy: formData.builtBy.trim() || undefined,
      builtByUrl: formData.builtByUrl.trim() || undefined,
      tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      suggestedRelationships,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="ns-noise min-h-[70vh] bg-transparent py-16">
        <div className="container max-w-2xl">
          <Card className="ns-surface mx-auto border-slate-200 p-10 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-sky-500" />
            <h1 className="text-3xl font-bold text-slate-950">{t("signInToContribute")}</h1>
            <p className="mx-auto mt-3 max-w-md text-slate-600">{t("contributionReview")}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button onClick={() => { startLogin(); }} className="bg-sky-600 text-white hover:bg-sky-700">{t("signInToContribute")}</Button>
              <Button variant="outline" onClick={() => setLocation("/browse")} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">{t("browseResources")}</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="ns-noise min-h-[70vh] bg-transparent py-16">
        <div className="container max-w-2xl">
          <Card className="ns-surface ns-hover-lift mx-auto border-emerald-200 bg-white p-10 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="text-3xl font-bold text-slate-950">{t("submissionReceived")}</h1>
            <p className="mx-auto mt-3 max-w-md text-slate-600">{t("submissionThanks")}</p>
            <div className="mt-7 flex justify-center gap-3">
              <Button onClick={() => setLocation("/browse")} className="bg-sky-600 text-white hover:bg-sky-700">{t("browseResources")}</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>{t("submitAnother")}</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <section className="ns-noise border-b border-slate-200/80 bg-white/80">
        <div className="container py-10 md:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">{t("communityContribution")}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{t("submit")}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{t("submitResourceIntro")}</p>
        </div>
      </section>

      <div className="container max-w-4xl py-8 md:py-10">
        {submitError && (
          <Card className="animate-fade-in-up mb-6 border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
            <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><p>{submitError}</p></div>
          </Card>
        )}

        <Card className="ns-surface mb-6 border-sky-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-2 text-sky-700"><Upload className="h-5 w-5" /></div>
            <div><h2 className="text-xl font-semibold text-slate-950">{t("importResources")}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{t("importResourcesIntro")}</p></div>
          </div>
          <div className="mt-5 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm leading-6 text-emerald-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p>{t("importPrivacy")}</p></div>
          <label
            onDragEnter={(event) => { event.preventDefault(); setIsDropActive(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDropActive(false)}
            onDrop={(event) => { event.preventDefault(); setIsDropActive(false); void handleImportFile(event.dataTransfer.files?.[0]); }}
            className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center transition-colors ${isDropActive ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/60"}`}
          >
            <FileText className="h-7 w-7 text-sky-600" /><span className="mt-3 font-semibold text-slate-800">{t("dropFile")}</span><span className="mt-1 text-sm text-slate-500">ZIP, TXT, PDF, DOCX, XLSX, PPTX, RTF, CSV, HTML, MD, PNG, JPG · 8 MB max</span>
            <span className="mt-4 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">{t("chooseFile")}</span>
            <input className="sr-only" type="file" accept=".zip,.txt,.md,.csv,.html,.htm,.pdf,.docx,.xlsx,.pptx,.rtf,.odt,.ods,.odp,.png,.jpg,.jpeg,.webp" onChange={(event) => { void handleImportFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          </label>
          {parseArtifactMutation.isPending && <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-sky-700"><Loader2 className="h-4 w-4 animate-spin" />{t("processingImport")}</p>}
          {importError && <p role="alert" className="mt-4 text-sm font-medium text-red-700">{importError}</p>}
          {importSummary && <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">{t("importResults")}</p><p className="mt-1 text-sm text-slate-600">{importSummary.candidates.length} {t("foundCandidates")} · {importSummary.rejectedUrlMentions} {t("rejectedLinks")}</p></div><span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">{t("personalDataDiscarded")}</span></div>{importSummary.requiresLocalOcr && <p className="mt-3 text-sm text-amber-800">{t("imageOcrLocal")}</p>}<div className="mt-4 grid gap-2 md:grid-cols-2">{importSummary.candidates.slice(0, 20).map((url) => <button type="button" key={url} onClick={() => useImportedCandidate(url)} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:border-sky-300 hover:text-sky-800"><span className="truncate">{url}</span><span className="shrink-0 text-xs font-semibold text-sky-700">{t("useCandidate")}</span></button>)}</div>{importSummary.candidates.length > 20 && <p className="mt-3 text-sm text-slate-500">Showing the first 20 candidates. Use a smaller source file to review a focused set.</p>}</div>}
        </Card>

        {isAuthenticated && archiveHistory.length > 0 && <Card className="ns-surface mb-6 border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-sky-700" /><div><h2 className="font-semibold text-slate-950">Anonymized import history</h2><p className="mt-1 text-sm leading-6 text-slate-600">This aggregate status is intentionally not linked to your account or source file. It lets contributors understand the review pipeline without retaining identity, messages, or upload records.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{archiveHistory.map((batch) => <div key={batch.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">Import batch #{batch.id}</p><span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">{batch.status.replace("_", " ")}</span></div><p className="mt-2 text-sm text-slate-600">{batch.uniqueCandidates} privacy-screened candidates · {batch.rejectedUrlMentions} excluded before review</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span className="rounded-lg bg-white px-2 py-1 text-emerald-700">{batch.statusCounts.reviewReady} review-ready</span><span className="rounded-lg bg-white px-2 py-1 text-slate-700">{batch.statusCounts.excluded} policy or duplicate excluded</span><span className="rounded-lg bg-white px-2 py-1 text-sky-700">{batch.statusCounts.submitted} in moderation</span><span className="rounded-lg bg-white px-2 py-1 text-amber-700">{batch.statusCounts.retryNeeded} retry needed</span></div><p className="mt-2 text-xs text-slate-500">Created {new Date(batch.createdAt).toLocaleDateString()}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-slate-500">Deletion-safe design: NorthStar stores no original archive, message, sender, contact, timestamp, or account linkage to delete. Candidates can be excluded or sent to human moderation, with non-identifying audit history retained.</p></Card>}

        <form onSubmit={showPreview ? handleSubmit : handlePreview} className="space-y-6">
          <Card className="ns-surface border-slate-200/90 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3"><Sparkles className="h-5 w-5 text-sky-600" /><div><h2 className="text-xl font-semibold text-slate-950">{t("startWithUrl")}</h2><p className="text-sm text-slate-500">{t("metadataPrefill")}</p></div></div>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resource-url">{t("resourceUrl")} *</label>
                <div className="relative"><Input id="resource-url" type="url" value={formData.url} onChange={(event) => updateField("url", event.target.value)} placeholder="https://example.com" required className="pr-10" />{isDuplicateChecking && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sky-500" />}</div>
                {metadataError && <p className="mt-2 text-sm text-amber-700">{t("metadataUnavailable")}</p>}
                {metadata && <p className="mt-2 text-sm text-emerald-700">{t("metadataLoaded")} {metadata.url}</p>}
              </div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resource-title">{t("resourceTitle")} *</label><Input id="resource-title" name="title" value={formData.title} onChange={(event) => updateField("title", event.target.value)} placeholder="e.g. Figma, GitHub, or a useful open-source library" required /></div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resource-description">{t("description")}</label><Textarea id="resource-description" name="description" value={formData.description} onChange={(event) => updateField("description", event.target.value)} placeholder={t("resourceDescriptionPlaceholder")} rows={5} /></div>
            </div>
          </Card>

          {duplicateResources.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><h2 className="font-semibold text-amber-950">{t("possibleDuplicates")}</h2><p className="mt-1 text-sm text-amber-800">{t("duplicatesGuidance")}</p></div></div>
              <div className="mt-4 space-y-3">{duplicateResources.map((resource) => <div key={resource.id} className="rounded-xl border border-amber-200 bg-white p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-950">{resource.title}</p><p className="mt-1 line-clamp-2 text-sm text-slate-600">{resource.description || resource.url}</p></div>{resource.duplicateType === "pending_submission" || !resource.slug ? <span className="shrink-0 text-sm font-semibold text-amber-700">{t("pendingReview")}</span> : <a href={`/resource/${resource.slug}`} className="shrink-0 text-sm font-semibold text-sky-600 hover:text-sky-700">{t("view")} <ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a>}</div></div>)}</div>
            </Card>
          )}

          <Card className="ns-surface border-slate-200/90 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold text-slate-950">{t("classifyResource")}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("category")} *</label><Select value={formData.categoryId || undefined} onValueChange={(value) => { updateField("categoryId", value); updateField("subcategoryId", ""); }}><SelectTrigger><SelectValue placeholder={t("selectCategory")} /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("subcategory")}</label><Select value={formData.subcategoryId || undefined} onValueChange={(value) => updateField("subcategoryId", value)} disabled={!categoryId || subcategories.length === 0}><SelectTrigger><SelectValue placeholder={subcategories.length ? t("selectSubcategory") : t("noSubcategories")} /></SelectTrigger><SelectContent>{subcategories.map((subcategory) => <SelectItem key={subcategory.id} value={String(subcategory.id)}>{subcategory.name}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("pricingModel")}</label><Select value={formData.pricing} onValueChange={(value) => updateField("pricing", value as FormData["pricing"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["free", "freemium", "paid", "open_source", "enterprise"].map((value) => <SelectItem key={value} value={value}>{value.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resource-license">License</label><Input id="resource-license" value={formData.license} onChange={(event) => updateField("license", event.target.value)} placeholder="MIT, Apache 2.0, Commercial" /></div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resource-built-by">{t("builtBy")}</label><Input id="resource-built-by" value={formData.builtBy} onChange={(event) => updateField("builtBy", event.target.value)} placeholder="Organization or creator" /></div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resource-built-by-url">{t("builderUrl")}</label><Input id="resource-built-by-url" type="url" value={formData.builtByUrl} onChange={(event) => updateField("builtByUrl", event.target.value)} placeholder="https://company.example" /></div>
              <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="resource-tags">{t("tags")}</label><Input id="resource-tags" value={formData.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="design, collaboration, open source" /><p className="mt-2 text-xs text-slate-500">{t("separateTags")}</p></div>
            </div>
          </Card>

          <Card className="ns-surface border-slate-200/90 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold text-slate-950">{t("graphConnections")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t("graphSuggestionGuidance")}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_190px_auto]">
              <Input value={relationSearch} onChange={(event) => setRelationSearch(event.target.value)} placeholder={t("searchExistingResource")} />
              <Select value={relationType} onValueChange={(value) => setRelationType(value as SuggestedRelationship["type"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RELATIONSHIP_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{relationshipLabels[type.value]}</SelectItem>)}</SelectContent></Select>
              <Button type="button" variant="outline" disabled={!relationSearch.trim() || !relationshipResults?.items?.[0]} onClick={() => relationshipResults?.items?.[0] && addSuggestedRelationship(relationshipResults.items[0].id)}><Plus className="mr-2 h-4 w-4" /> {t("addFirstMatch")}</Button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2"><Input type="url" value={relationshipEvidenceUrl} onChange={(event) => setRelationshipEvidenceUrl(event.target.value)} placeholder={t("evidenceUrlOptional")} /><Input value={relationshipSourceContext} onChange={(event) => setRelationshipSourceContext(event.target.value)} maxLength={255} placeholder={t("sourceContextOptional")} /><Textarea value={relationshipRationale} onChange={(event) => setRelationshipRationale(event.target.value)} maxLength={2000} rows={3} className="md:col-span-2" placeholder={t("relationshipRationalePlaceholder")} /></div>
            {relationshipResults?.items && relationshipResults.items.length > 0 && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("matches")}</p><div className="mt-2 flex flex-wrap gap-2">{relationshipResults.items.map((resource) => <button type="button" key={resource.id} onClick={() => addSuggestedRelationship(resource.id)} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-sky-700">{resource.title}</button>)}</div></div>}
            {suggestedRelationships.length > 0 && <div className="mt-4 space-y-2">{suggestedRelationships.map((relationship, index) => { const target = relationshipResults?.items?.find((item) => item.id === relationship.targetId); return <div key={`${relationship.targetId}-${relationship.type}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm"><span className="text-slate-700"><span className="block">{target?.title ?? `Resource #${relationship.targetId}`} <strong className="text-sky-700">· {relationshipLabels[relationship.type]}</strong></span>{relationship.evidenceUrl && <a href={relationship.evidenceUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-medium text-sky-700 hover:text-sky-900">{t("evidenceSupplied")}</a>}{relationship.rationale && <span className="mt-1 block text-xs text-slate-500">{relationship.rationale}</span>}</span><button type="button" onClick={() => setSuggestedRelationships((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={t("removeSuggestedRelationship")} className="text-slate-400 hover:text-red-600"><X className="h-4 w-4" /></button></div>; })}</div>}
          </Card>

          {showPreview && (
            <Card className="border-sky-200 bg-sky-50 p-6 shadow-sm md:p-8">
              <div className="flex items-start gap-3"><CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" /><div><h2 className="text-xl font-semibold text-slate-950">{t("reviewBeforeSubmitting")}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{t("moderationPayload")}</p></div></div>
              <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <div><dt className="font-semibold text-slate-500">{t("title")}</dt><dd className="mt-1 text-slate-950">{formData.title}</dd></div>
                <div><dt className="font-semibold text-slate-500">{t("resourceUrl")}</dt><dd className="mt-1 break-all text-sky-700">{formData.url}</dd></div>
                <div><dt className="font-semibold text-slate-500">{t("category")}</dt><dd className="mt-1 text-slate-950">{selectedCategory?.name ?? "—"}{selectedSubcategory ? ` / ${selectedSubcategory.name}` : ""}</dd></div>
                <div><dt className="font-semibold text-slate-500">{t("pricingModel")}</dt><dd className="mt-1 capitalize text-slate-950">{formData.pricing.replace("_", " ")}</dd></div>
                <div className="md:col-span-2"><dt className="font-semibold text-slate-500">{t("description")}</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{formData.description || t("noDescriptionProvided")}</dd></div>
                <div><dt className="font-semibold text-slate-500">{t("tags")}</dt><dd className="mt-1 text-slate-700">{formData.tags || t("noTags")}</dd></div>
                <div><dt className="font-semibold text-slate-500">{t("suggestedRelationships")}</dt><dd className="mt-1 text-slate-700">{suggestedRelationships.length || t("none")}</dd></div>
              </dl>
            </Card>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setLocation("/browse")}>{t("cancel")}</Button>{showPreview && <Button type="button" variant="outline" onClick={() => setShowPreview(false)}>{t("editDetails")}</Button>}<Button type="submit" disabled={submitMutation.isPending || isDuplicateChecking || duplicateResources.length > 0} className="bg-sky-600 text-white hover:bg-sky-700">{submitMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("sendingToModeration")}</> : showPreview ? t("submitForReview") : t("reviewBeforeSubmitting")}</Button></div>
        </form>
      </div>
    </div>
  );
}
