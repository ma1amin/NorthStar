import { useMemo, useState } from "react";
import { BarChart3, Clock3, FileCheck2, Loader2, MousePointerClick, SearchX } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModerationBackLink } from "@/components/ModerationBackLink";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const percent = (value: number) => `${Math.round(value * 1000) / 10}%`;

export default function SearchQuality() {
  const { t } = useLanguage();
  const { isAuthenticated, user, startLogin } = useAuth();
  const canView = isAuthenticated && (user?.role === "admin" || user?.role === "moderator");
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [resourceIds, setResourceIds] = useState("");
  const [notes, setNotes] = useState("");
  const { data: summary, isLoading: summaryLoading } = trpc.moderation.searchQuality.useQuery({ days: 30 }, { enabled: canView });
  const { data: cases = [], isLoading: casesLoading } = trpc.moderation.listSearchEvaluationCases.useQuery({ status: "draft" }, { enabled: canView });
  const createCase = trpc.moderation.createSearchEvaluationCase.useMutation({ onSuccess: async () => { setQuery(""); setResourceIds(""); setNotes(""); await utils.moderation.listSearchEvaluationCases.invalidate(); } });
  const parsedIds = useMemo(() => Array.from(new Set(resourceIds.split(",").map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value > 0))).slice(0, 20), [resourceIds]);
  if (!isAuthenticated) return <div className="container max-w-3xl py-16"><Card className="ns-surface p-8 text-center"><h1 className="text-2xl font-semibold text-slate-950">{t("searchQuality")}</h1><p className="mt-3 text-slate-600">{t("qualityAccessDenied")}</p><Button onClick={startLogin} className="mt-5 bg-sky-600 text-white hover:bg-sky-700">{t("signIn")}</Button></Card></div>;
  if (!canView) return <div className="container max-w-3xl py-16"><Card className="ns-surface p-8 text-center"><h1 className="text-2xl font-semibold text-slate-950">{t("searchQuality")}</h1><p className="mt-3 text-slate-600">{t("qualityAccessDenied")}</p></Card></div>;
  const metrics = [{ label: t("searchVolume"), value: summary?.searchCount ?? 0, icon: BarChart3 }, { label: t("zeroResultRate"), value: percent(summary?.zeroResultRate ?? 0), icon: SearchX }, { label: t("clickThroughRate"), value: percent(summary?.clickThroughRate ?? 0), icon: MousePointerClick }, { label: t("averageLatency"), value: summary?.averageLatencyMs === null || summary?.averageLatencyMs === undefined ? "—" : `${summary.averageLatencyMs} ms`, icon: Clock3 }];
  return <div className="ns-noise min-h-screen py-10 md:py-14"><div className="container max-w-6xl"><ModerationBackLink className="mb-5" /><header><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">NorthStar</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">{t("searchQuality")}</h1><p className="mt-3 max-w-3xl text-slate-600">{t("searchQualityIntro")}</p></header><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => { const Icon = metric.icon; return <Card key={metric.label} className="ns-surface p-5 shadow-sm"><Icon className="h-5 w-5 text-sky-600" /><p className="mt-4 text-sm text-slate-500">{metric.label}</p><p className="mt-1 text-2xl font-semibold text-slate-950">{summaryLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : metric.value}</p></Card>; })}</section><section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><Card className="ns-surface p-6 shadow-sm"><div className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-violet-600" /><h2 className="text-xl font-semibold text-slate-950">{t("createEvaluationCase")}</h2></div><form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); if (query.trim() && parsedIds.length) createCase.mutate({ query: query.trim(), expectedResourceIds: parsedIds, notes: notes.trim() || undefined }); }}><div className="space-y-2"><Label htmlFor="quality-query">{t("search")}</Label><Input id="quality-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={255} required /></div><div className="space-y-2"><Label htmlFor="expected-resource-ids">{t("expectedResourceIds")}</Label><Input id="expected-resource-ids" value={resourceIds} onChange={(event) => setResourceIds(event.target.value)} placeholder="12, 31" required /><p className="text-xs text-slate-500">{t("expectedResourceIdsHelp")}</p></div><div className="space-y-2"><Label htmlFor="quality-notes">{t("caseNotes")}</Label><Textarea id="quality-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={3} /></div><Button type="submit" disabled={createCase.isPending || !parsedIds.length} className="bg-sky-600 text-white hover:bg-sky-700">{createCase.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("createEvaluationCase")}</Button></form></Card><Card className="ns-surface p-6 shadow-sm"><h2 className="text-xl font-semibold text-slate-950">{t("relevanceCases")}</h2>{casesLoading ? <Loader2 className="mt-8 h-6 w-6 animate-spin text-sky-600" /> : cases.length ? <div className="mt-5 space-y-3">{cases.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-950">{item.query}</p><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{t("draft")}</Badge></div><p className="mt-2 text-sm text-slate-600">{t("expectedResourceIds")}: {item.expectedResourceIds.join(", ")}</p>{item.notes && <p className="mt-2 text-sm text-slate-500">{item.notes}</p>}</div>)}</div> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{t("noRelevanceCases")}</p>}</Card></section></div></div>;
}
