import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle, CheckCircle, ClipboardCheck, FileCheck2, History, ListChecks, Loader2, Network, Pencil, RefreshCw, Save, Search, ShieldCheck, Sparkles, Users, XCircle } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getModerationActionKey, getModerationEntityKey, isModerationActionPending, isModerationEntityPending } from "@/lib/moderationActions";

const relationshipLabels: Record<string, string> = {
  alternative_to: "Alternative To", similar_to: "Similar To", integrates_with: "Integrates With", built_by: "Built By", maintained_by: "Maintained By", funded_by: "Funded By", used_by: "Used By", depends_on: "Depends On", part_of: "Part Of", competitor_of: "Competitor Of",
};

type EditableResource = {
  id: number; title: string; description: string | null; pricing: "free" | "freemium" | "paid" | "open_source" | "enterprise"; license: string | null; builtBy: string | null; status: "approved" | "pending" | "rejected";
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("submissions");
  const [historyQuery, setHistoryQuery] = useState("");
  const [resourceQuery, setResourceQuery] = useState("");
  const [editingResource, setEditingResource] = useState<EditableResource | null>(null);
  const [pendingActions, setPendingActions] = useState<string[]>([]);
  const pendingEntityKeysRef = useRef(new Set<string>());
  const [resolvedSubmissionIds, setResolvedSubmissionIds] = useState<number[]>([]);
  const [resolvedRelationshipIds, setResolvedRelationshipIds] = useState<number[]>([]);
  const [resolvedSourceIds, setResolvedSourceIds] = useState<number[]>([]);
  const isModerator = isAuthenticated && (user?.role === "admin" || user?.role === "moderator");
  const isAdministrator = user?.role === "admin";

  const { data: submissions, isLoading: submissionsLoading, refetch: refetchSubmissions } = trpc.moderation.getPendingSubmissions.useQuery({ limit: 50, offset: 0 }, { enabled: isModerator });
  const { data: relationships, isLoading: relationshipsLoading, refetch: refetchRelationships } = trpc.moderation.getPendingRelationships.useQuery({ limit: 50, offset: 0 }, { enabled: isModerator });
  const { data: pendingSources, isLoading: sourcesLoading, refetch: refetchSources } = trpc.moderation.getPendingSources.useQuery({ limit: 50, offset: 0 }, { enabled: isModerator });
  const { data: freshnessQueue, isLoading: freshnessLoading, refetch: refetchFreshness } = trpc.moderation.getFreshnessQueue.useQuery({ limit: 50, offset: 0 }, { enabled: isModerator });
  const { data: duplicateProposals, isLoading: duplicatesLoading, refetch: refetchDuplicates } = trpc.moderation.getProposedDuplicateResolutions.useQuery({ limit: 50, offset: 0 }, { enabled: isModerator });
  const { data: auditLogs, isLoading: auditLogsLoading, isError: auditLogsError } = trpc.moderation.getAuditLogs.useQuery({ limit: 50, offset: 0 }, { enabled: isModerator });
  const { data: resourcesData, isLoading: resourcesLoading, refetch: refetchResources } = trpc.resources.listFiltered.useQuery({ limit: 50, offset: 0, sort: "newest" }, { enabled: isAdministrator });

  const approveSubmission = trpc.moderation.approveSubmission.useMutation({
    onSuccess: (result, variables) => {
      setResolvedSubmissionIds((current) => current.includes(variables.submissionId) ? current : [...current, variables.submissionId]);
      toast.success(`${t("approved")} · ${Math.max(0, result.approvalDurationMs)} ms`);
      void refetchSubmissions();
    },
  });
  const rejectSubmission = trpc.moderation.rejectSubmission.useMutation({ onSuccess: (_result, variables) => { setResolvedSubmissionIds((current) => current.includes(variables.submissionId) ? current : [...current, variables.submissionId]); toast.success(t("reject")); void refetchSubmissions(); } });
  const approveRelationship = trpc.relationships.approve.useMutation({ onSuccess: (_result, variables) => { setResolvedRelationshipIds((current) => current.includes(variables.id) ? current : [...current, variables.id]); toast.success(t("approved")); void refetchRelationships(); } });
  const rejectRelationship = trpc.moderation.rejectRelationship.useMutation({ onSuccess: (_result, variables) => { setResolvedRelationshipIds((current) => current.includes(variables.relationshipId) ? current : [...current, variables.relationshipId]); toast.success(t("reject")); void refetchRelationships(); } });
  const reviewSource = trpc.moderation.reviewSource.useMutation({ onSuccess: (result, variables) => { setResolvedSourceIds((current) => current.includes(variables.sourceId) ? current : [...current, variables.sourceId]); toast.success(`${t("reviewSource")} · ${Math.max(0, result.reviewDurationMs)} ms`); void refetchSources(); } });
  const recordFreshness = trpc.moderation.recordFreshness.useMutation({ onSuccess: () => { toast.success(t("recordFreshness")); refetchFreshness(); } });
  const proposeAlias = trpc.moderation.proposeDuplicateResolution.useMutation({ onSuccess: () => { toast.success(t("proposeAlias")); refetchDuplicates(); } });
  const confirmAlias = trpc.moderation.confirmDuplicateResolution.useMutation({ onSuccess: () => { toast.success(t("aliasConfirmed")); refetchDuplicates(); refetchFreshness(); refetchResources(); } });
  const runQueueAction = async (actionKey: string, action: () => Promise<unknown>) => {
    const entityKey = getModerationEntityKey(actionKey);
    if (pendingEntityKeysRef.current.has(entityKey)) return;
    pendingEntityKeysRef.current.add(entityKey);
    setPendingActions((current) => current.includes(actionKey) ? current : [...current, actionKey]);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The moderation action could not be completed.");
    } finally {
      pendingEntityKeysRef.current.delete(entityKey);
      setPendingActions((current) => current.filter((pendingAction) => pendingAction !== actionKey));
    }
  };

  const filteredAuditLogs = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) return auditLogs ?? [];
    return (auditLogs ?? []).filter((entry: any) => [entry.userId, entry.action, entry.entityType, entry.entityId].some((value) => String(value ?? "").toLowerCase().includes(query)));
  }, [auditLogs, historyQuery]);
  const filteredResources = useMemo(() => {
    const query = resourceQuery.trim().toLowerCase();
    const resources = resourcesData?.items ?? [];
    return query ? resources.filter((resource: any) => `${resource.title} ${resource.description ?? ""} ${resource.builtBy ?? ""}`.toLowerCase().includes(query)) : resources;
  }, [resourceQuery, resourcesData]);
  const visibleSubmissions = useMemo(() => (submissions ?? []).filter((submission) => !resolvedSubmissionIds.includes(submission.id)), [resolvedSubmissionIds, submissions]);
  const visibleRelationships = useMemo(() => (relationships ?? []).filter((relationship) => !resolvedRelationshipIds.includes(relationship.id)), [relationships, resolvedRelationshipIds]);
  const visibleSources = useMemo(() => (pendingSources ?? []).filter((source) => !resolvedSourceIds.includes(source.id)), [pendingSources, resolvedSourceIds]);

  useEffect(() => {
    if (!isAdministrator && selectedTab === "resources") setSelectedTab("submissions");
  }, [isAdministrator, selectedTab]);

  if (!isModerator) return <AccessDenied onHome={() => setLocation("/")} />;

  const commandCards = [
    { label: t("reportTriage"), detail: t("reportTriageDetail"), icon: ListChecks, href: "/admin/reports" },
    { label: t("bulkDecisions"), detail: t("bulkDecisionsDetail"), icon: ClipboardCheck, href: "/admin/bulk" },
    ...(isAdministrator ? [
      { label: t("editSuggestions"), detail: t("editSuggestionsDetail"), icon: Pencil, href: "/admin/edit-suggestions" },
      { label: t("aiReviewDrafts"), detail: t("aiReviewDraftsDetail"), icon: Sparkles, href: "/admin/ai-drafts" },
      { label: "Archive Imports", detail: "Review privacy-screened candidates and send approved selections to moderation.", icon: FileCheck2, href: "/admin/archive-imports" },
      { label: "Archive Governance", detail: "Manage bounded metadata retries and advisory trusted source domains.", icon: ShieldCheck, href: "/admin/archive-governance" },
      { label: "Archive Bulk Review", detail: "Confirm a category and hand a selected set of candidates to moderation.", icon: FileCheck2, href: "/admin/archive-bulk-review" },
      { label: t("userManagement"), detail: t("userManagementDetail"), icon: Users, href: "/admin/users" },
    ] : []),
  ];

  return (
    <div className="ns-noise min-h-screen bg-transparent py-10 md:py-14">
      <div className="container max-w-6xl">
        <header className="ns-noise ns-surface rounded-3xl border-sky-100 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),transparent_35%),linear-gradient(135deg,#fff,#f8fbff)] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{t("humanOversight")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{t("moderationCommandCenter")}</h1><p className="mt-3 max-w-2xl text-slate-600">{t("moderationIntro")}</p></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label={t("submissions")} value={submissions?.length ?? 0} tone="amber" />
              <Metric label={t("relationships")} value={relationships?.length ?? 0} tone="violet" />
              <Metric label={t("pendingSources")} value={pendingSources?.length ?? 0} tone="sky" />
              <Metric label={t("duplicateProposals")} value={duplicateProposals?.length ?? 0} tone="rose" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{commandCards.map((card) => { const Icon = card.icon; return <button type="button" key={card.href} onClick={() => setLocation(card.href)} className="ns-hover-lift group rounded-2xl border border-white bg-white/80 p-4 text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><Icon className="h-5 w-5 text-sky-600 transition group-hover:scale-110" /><p className="mt-3 font-semibold text-slate-950">{card.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{card.detail}</p></button>; })}</div>
        </header>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-7 w-full">
          <TabsList className="ns-surface flex h-auto w-full flex-wrap justify-start gap-1 bg-white/75 p-1 shadow-sm">
            <TabsTrigger value="submissions" className="gap-2 py-3"><AlertCircle className="h-4 w-4" />{t("submissions")} ({submissions?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="relationships" className="gap-2 py-3"><Network className="h-4 w-4" />{t("relationships")} ({relationships?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="sources" className="gap-2 py-3"><FileCheck2 className="h-4 w-4" />{t("pendingSources")} ({pendingSources?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="freshness" className="gap-2 py-3"><RefreshCw className="h-4 w-4" />{t("freshnessQueue")}</TabsTrigger>
            <TabsTrigger value="duplicates" className="gap-2 py-3"><ShieldCheck className="h-4 w-4" />{t("duplicateProposals")} ({duplicateProposals?.length ?? 0})</TabsTrigger>
            {isAdministrator && <TabsTrigger value="resources" className="gap-2 py-3"><Pencil className="h-4 w-4" />{t("resources")}</TabsTrigger>}
            <TabsTrigger value="history" className="gap-2 py-3"><History className="h-4 w-4" />{t("history")}</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-5">
            {submissionsLoading ? <LoadingState /> : visibleSubmissions.length ? <div className="grid gap-4">{visibleSubmissions.map((submission: any) => { const approveKey = getModerationActionKey("submission", submission.id, "approve"); const rejectKey = getModerationActionKey("submission", submission.id, "reject"); const rowPending = isModerationEntityPending(pendingActions, approveKey); return <Card key={submission.id} className="ns-hover-lift border-l-4 border-l-amber-500 bg-white/90 p-6 shadow-sm"><div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]"><div><div className="flex items-start justify-between gap-4"><div><h2 className="ns-resource-title text-slate-950">{submission.title}</h2><p className="mt-1 break-all text-sm text-sky-700">{submission.url}</p></div><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{t("pending")}</Badge></div><p className="mt-4 text-sm leading-6 text-slate-600">{submission.description || "No description provided."}</p>{submission.sourceUrl && <a href={submission.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 block break-all text-xs font-medium text-violet-700 hover:text-violet-900">Primary evidence · {submission.sourceType ?? "source"} · {submission.sourceUrl}</a>}<p className="mt-3 text-xs text-slate-500">{new Date(submission.createdAt).toLocaleDateString()}</p></div><div className="flex flex-col gap-2"><Button onClick={() => void runQueueAction(approveKey, () => approveSubmission.mutateAsync({ submissionId: submission.id }))} disabled={rowPending} className="bg-emerald-600 text-white hover:bg-emerald-700">{isModerationActionPending(pendingActions, approveKey) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}{t("approve")}</Button><Button onClick={() => void runQueueAction(rejectKey, () => rejectSubmission.mutateAsync({ submissionId: submission.id }))} disabled={rowPending} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">{isModerationActionPending(pendingActions, rejectKey) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}{t("reject")}</Button></div></div></Card>; })}</div> : <QueueEmpty label={t("submissions")} />}
          </TabsContent>

          <TabsContent value="relationships" className="mt-5">
            {relationshipsLoading ? <LoadingState /> : visibleRelationships.length ? <div className="grid gap-4">{visibleRelationships.map((relationship: any) => { const approveKey = getModerationActionKey("relationship", relationship.id, "approve"); const rejectKey = getModerationActionKey("relationship", relationship.id, "reject"); const rowPending = isModerationEntityPending(pendingActions, approveKey); return <Card key={relationship.id} className="ns-hover-lift border-l-4 border-l-violet-500 bg-white/90 p-6 shadow-sm"><div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">{relationshipLabels[relationship.type] ?? relationship.type}</p><h2 className="ns-resource-title mt-2 text-slate-950">Resource #{relationship.sourceId} <span className="text-slate-400">→</span> Resource #{relationship.targetId}</h2><p className="mt-4 text-sm leading-6 text-slate-600">Review this relationship for meaningful, non-redundant, and defensible graph value before publishing it.</p></div><div className="flex flex-col gap-2"><Button onClick={() => void runQueueAction(approveKey, () => approveRelationship.mutateAsync({ id: relationship.id }))} disabled={rowPending} className="bg-emerald-600 text-white hover:bg-emerald-700">{isModerationActionPending(pendingActions, approveKey) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}{t("approve")}</Button><Button onClick={() => void runQueueAction(rejectKey, () => rejectRelationship.mutateAsync({ relationshipId: relationship.id }))} disabled={rowPending} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">{isModerationActionPending(pendingActions, rejectKey) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}{t("reject")}</Button></div></div></Card>; })}</div> : <QueueEmpty label={t("relationships")} />}
          </TabsContent>

          <TabsContent value="sources" className="mt-5">
            {sourcesLoading ? <LoadingState /> : visibleSources.length ? <div className="grid gap-4">{visibleSources.map((source: any) => { const approveKey = getModerationActionKey("source", source.id, "approve"); const supersedeKey = getModerationActionKey("source", source.id, "supersede"); const rejectKey = getModerationActionKey("source", source.id, "reject"); const rowPending = isModerationEntityPending(pendingActions, approveKey); return <Card key={source.id} className="ns-hover-lift border-l-4 border-l-sky-500 bg-white/90 p-6 shadow-sm"><div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_190px]"><div><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="ns-resource-title text-slate-950">{source.resourceTitle}</h2><a href={source.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-sky-700 hover:text-sky-900">{source.url}</a></div><Badge className="capitalize bg-sky-100 text-sky-800 hover:bg-sky-100">{source.sourceType}</Badge></div>{source.attribution && <p className="mt-4 text-sm text-slate-700"><span className="font-medium">{t("sourceAttribution")}:</span> {source.attribution}</p>}{source.licenseNote && <p className="mt-2 text-sm text-slate-600">{source.licenseNote}</p>}<p className="mt-3 text-xs text-slate-500">{t("reviewedBy")}: {source.contributorName || "Unknown"} · {new Date(source.capturedAt).toLocaleDateString()}</p></div><div className="flex flex-col gap-2"><Button onClick={() => void runQueueAction(approveKey, () => reviewSource.mutateAsync({ sourceId: source.id, status: "approved" }))} disabled={rowPending} className="bg-emerald-600 text-white hover:bg-emerald-700">{isModerationActionPending(pendingActions, approveKey) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}{t("approveSource")}</Button><Button onClick={() => void runQueueAction(supersedeKey, () => reviewSource.mutateAsync({ sourceId: source.id, status: "superseded" }))} disabled={rowPending} variant="outline">{isModerationActionPending(pendingActions, supersedeKey) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}{t("supersedeSource")}</Button><Button onClick={() => void runQueueAction(rejectKey, () => reviewSource.mutateAsync({ sourceId: source.id, status: "rejected" }))} disabled={rowPending} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">{isModerationActionPending(pendingActions, rejectKey) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}{t("rejectSource")}</Button></div></div></Card>; })}</div> : <QueueEmpty label={t("noPendingSources")} />}
          </TabsContent>

          <TabsContent value="freshness" className="mt-5">
            {freshnessLoading ? <LoadingState /> : freshnessQueue?.length ? <div className="grid gap-4">{freshnessQueue.map((item: any) => <FreshnessCard key={item.resourceId} item={item} onRecord={(input) => recordFreshness.mutate(input)} pending={recordFreshness.isPending} />)}</div> : <QueueEmpty label={t("noFreshnessItems")} />}
          </TabsContent>

          <TabsContent value="duplicates" className="mt-5 space-y-5">
            <DuplicateProposalForm onPropose={(input) => proposeAlias.mutate(input)} pending={proposeAlias.isPending} />
            {duplicatesLoading ? <LoadingState /> : duplicateProposals?.length ? <div className="grid gap-4">{duplicateProposals.map((proposal: any) => <Card key={proposal.id} className="border-l-4 border-l-rose-500 bg-white/90 p-6 shadow-sm"><div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_200px]"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">{t("duplicateProposals")}</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{proposal.duplicateTitle} <span className="text-slate-400">→</span> {proposal.canonicalTitle}</h2><p className="mt-3 text-sm leading-6 text-slate-700">{proposal.rationale}</p><p className="mt-3 text-xs text-slate-500">{t("reviewedBy")}: {proposal.proposerName || "Unknown"} · {new Date(proposal.createdAt).toLocaleDateString()}</p></div><div>{isAdministrator ? <Button onClick={() => confirmAlias.mutate({ resolutionId: proposal.id })} disabled={confirmAlias.isPending} className="w-full bg-rose-600 text-white hover:bg-rose-700"><ShieldCheck className="mr-2 h-4 w-4" />{t("confirmAlias")}</Button> : <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{t("confirmAliasDetail")}</p>}</div></div></Card>)}</div> : <QueueEmpty label={t("noDuplicateProposals")} />}
          </TabsContent>

          {isAdministrator && <TabsContent value="resources" className="mt-5"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"><Card className="ns-surface overflow-hidden bg-white/90 shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold text-slate-950">Published resources</h2><p className="mt-1 text-sm text-slate-600">Select a resource to correct metadata or adjust its publishing status.</p><SearchField label="Search published resources" value={resourceQuery} onChange={setResourceQuery} placeholder="Search title, summary, or builder" /></div>{resourcesLoading ? <LoadingState /> : filteredResources.length ? <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">{filteredResources.map((resource: any) => <button type="button" key={resource.id} onClick={() => setEditingResource(resource)} className={`flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${editingResource?.id === resource.id ? "bg-sky-50" : ""}`}><span className="min-w-0"><span className="block truncate font-semibold text-slate-900">{resource.title}</span><span className="mt-1 line-clamp-2 block text-sm leading-5 text-slate-600">{resource.description || resource.url}</span></span><Badge variant="outline" className="shrink-0 capitalize">{resource.pricing.replace("_", " ")}</Badge></button>)}</div> : <QueueEmpty label="resources" />}</Card>{editingResource ? <ResourceEditor key={editingResource.id} resource={editingResource} onSaved={() => { refetchResources(); setEditingResource(null); }} /> : <Card className="ns-surface p-10 text-center shadow-sm"><Pencil className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h2 className="font-semibold text-slate-950">Select a resource</h2><p className="mt-2 text-sm text-slate-600">Choose a published resource from the list to review and update its metadata.</p></Card>}</div></TabsContent>}

          <TabsContent value="history" className="mt-5">
            {auditLogsLoading ? <LoadingState /> : auditLogsError ? <AuditLogsError /> : <Card className="ns-surface overflow-hidden bg-white/90 shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-950">{t("moderationHistory")}</h2><p className="mt-1 text-sm text-slate-600">{t("moderationHistoryDetail")}</p></div><SearchField label="Search moderation history" value={historyQuery} onChange={setHistoryQuery} placeholder="Search actor, action, or entity" /></div>{filteredAuditLogs.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Entity</th><th className="px-5 py-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredAuditLogs.map((entry: any) => <tr key={entry.id} className="transition-colors hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-900">User #{entry.userId}</td><td className="px-5 py-4"><Badge variant="outline">{entry.action}</Badge></td><td className="px-5 py-4 text-slate-600">{entry.entityType} #{entry.entityId}</td><td className="px-5 py-4 text-slate-600">{new Date(entry.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <QueueEmpty label="history" />}</Card>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "amber" | "violet" | "sky" | "rose" }) {
  const styles = { amber: "border-amber-200 bg-amber-50 text-amber-700", violet: "border-violet-200 bg-violet-50 text-violet-700", sky: "border-sky-200 bg-sky-50 text-sky-700", rose: "border-rose-200 bg-rose-50 text-rose-700" }[tone];
  return <div className={`rounded-2xl border px-3 py-2 ${styles}`}><p className="text-[10px] font-semibold uppercase tracking-[0.08em]">{label}</p><p className="mt-1 text-xl font-bold text-slate-950">{value}</p></div>;
}

function FreshnessCard({ item, onRecord, pending }: { item: any; onRecord: (input: { resourceId: number; status: "current" | "needs_review" | "stale"; note?: string }) => void; pending: boolean }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"current" | "needs_review" | "stale">(item.latestStatus ?? "needs_review");
  const [note, setNote] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onRecord({ resourceId: item.resourceId, status, note: note.trim() || undefined }); };
  return <Card className="border-l-4 border-l-amber-500 bg-white/90 p-6 shadow-sm"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div><h2 className="text-xl font-semibold text-slate-950">{item.resourceTitle}</h2><a href={item.resourceUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm text-sky-700 hover:text-sky-900">{item.resourceUrl}</a><p className="mt-4 text-sm text-slate-600">{item.lastReviewedAt ? `${t("lastChecked")}: ${new Date(item.lastReviewedAt).toLocaleDateString()}` : t("noFreshnessReview")}</p></div><form className="space-y-3" onSubmit={submit}><label className="block text-sm font-medium text-slate-800">{t("freshness")}<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"><option value="current">{t("current")}</option><option value="needs_review">{t("needsReview")}</option><option value="stale">{t("stale")}</option></select></label><Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={2000} placeholder={t("freshnessNote")} /><Button type="submit" disabled={pending} className="w-full bg-amber-600 text-white hover:bg-amber-700">{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}{t("recordFreshness")}</Button></form></div></Card>;
}

function DuplicateProposalForm({ onPropose, pending }: { onPropose: (input: { duplicateResourceId: number; canonicalResourceId: number; rationale: string }) => void; pending: boolean }) {
  const { t } = useLanguage();
  const [duplicateResourceId, setDuplicateResourceId] = useState("");
  const [canonicalResourceId, setCanonicalResourceId] = useState("");
  const [rationale, setRationale] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onPropose({ duplicateResourceId: Number(duplicateResourceId), canonicalResourceId: Number(canonicalResourceId), rationale: rationale.trim() }); };
  return <Card className="ns-surface bg-white/90 p-6 shadow-sm"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-rose-700">{t("proposeAlias")}</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Preserve a duplicate as a canonical alias</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{t("confirmAliasDetail")}</p></div><form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={submit}><label className="block text-sm font-medium text-slate-800">Duplicate resource ID<Input className="mt-1.5" type="number" min="1" value={duplicateResourceId} onChange={(event) => setDuplicateResourceId(event.target.value)} required /></label><label className="block text-sm font-medium text-slate-800">Canonical resource ID<Input className="mt-1.5" type="number" min="1" value={canonicalResourceId} onChange={(event) => setCanonicalResourceId(event.target.value)} required /></label><label className="md:col-span-2 block text-sm font-medium text-slate-800">Rationale<Textarea className="mt-1.5" value={rationale} onChange={(event) => setRationale(event.target.value)} minLength={20} maxLength={2000} rows={3} required /></label><div className="md:col-span-2"><Button type="submit" disabled={pending} className="bg-rose-600 text-white hover:bg-rose-700">{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}{t("proposeAlias")}</Button></div></form></Card>;
}

function ResourceEditor({ resource, onSaved }: { resource: EditableResource; onSaved: () => void }) {
  const [form, setForm] = useState({ title: resource.title, description: resource.description ?? "", pricing: resource.pricing, license: resource.license ?? "", builtBy: resource.builtBy ?? "", status: resource.status });
  const updateResource = trpc.resources.update.useMutation({ onSuccess: () => { toast.success("Resource updated and added to moderation history"); onSaved(); }, onError: (error) => toast.error(error.message || "Unable to update resource") });
  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  return <Card className="ns-surface bg-white/90 p-5 shadow-sm"><div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-700">Resource editor</p><h2 className="mt-1 text-xl font-semibold text-slate-950">{resource.title}</h2></div><Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">#{resource.id}</Badge></div><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); updateResource.mutate({ id: resource.id, ...form }); }}><Field label="Title"><Input value={form.title} onChange={(event) => updateField("title", event.target.value)} required maxLength={255} /></Field><Field label="Description"><Textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={5} maxLength={5000} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Pricing"><select value={form.pricing} onChange={(event) => updateField("pricing", event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="free">Free</option><option value="freemium">Freemium</option><option value="paid">Paid</option><option value="open_source">Open source</option><option value="enterprise">Enterprise</option></select></Field><Field label="Status"><select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select></Field></div><Field label="License"><Input value={form.license} onChange={(event) => updateField("license", event.target.value)} maxLength={255} /></Field><Field label="Built by"><Input value={form.builtBy} onChange={(event) => updateField("builtBy", event.target.value)} maxLength={255} /></Field><Button type="submit" disabled={updateResource.isPending} className="w-full bg-sky-600 text-white hover:bg-sky-700">{updateResource.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving changes</> : <><Save className="mr-2 h-4 w-4" />Save resource</>}</Button></form></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">{label}</span>{children}</label>; }
function SearchField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="relative mt-4 block w-full sm:max-w-xs"><span className="sr-only">{label}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></label>; }
function AccessDenied({ onHome }: { onHome: () => void }) { return <div className="ns-noise min-h-screen bg-transparent py-12"><div className="container max-w-2xl"><Card className="ns-surface p-8 text-center shadow-sm"><AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" /><h1 className="mb-2 text-2xl font-bold text-slate-950">Access denied</h1><p className="mb-6 text-slate-600">You need moderator privileges to access the moderation dashboard.</p><Button onClick={onHome} className="bg-sky-600 text-white hover:bg-sky-700">Go to Home</Button></Card></div></div>; }
function LoadingState() { return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /></div>; }
function QueueEmpty({ label }: { label: string }) { return <Card className="ns-surface p-10 text-center shadow-sm"><CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" /><h2 className="font-semibold text-slate-950">Queue clear</h2><p className="mt-2 text-sm text-slate-600">{label}</p></Card>; }
function AuditLogsError() { return <Card className="ns-surface p-10 text-center shadow-sm" role="alert"><AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" /><h2 className="font-semibold text-slate-950">Unable to load moderation history</h2><p className="mt-2 text-sm text-slate-600">Refresh the page to try loading the activity record again.</p></Card>; }
