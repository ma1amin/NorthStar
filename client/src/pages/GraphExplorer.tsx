import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResourceIcon } from "@/components/ResourceIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { clampGraphScale } from "@/lib/graphViewport";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ExternalLink, GitBranch, Loader2, Maximize2, Minus, Network, Plus, RotateCcw, Search, X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useMemo, useState } from "react";

const NODE_POSITIONS = [
  { left: 16, top: 19 }, { left: 50, top: 12 }, { left: 84, top: 19 }, { left: 16, top: 56 },
  { left: 84, top: 56 }, { left: 16, top: 86 }, { left: 50, top: 90 }, { left: 84, top: 86 },
];

type Translate = ReturnType<typeof useLanguage>["t"];

export default function GraphExplorer() {
  const params = useParams<{ slug?: string }>();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [selectedAdjacentId, setSelectedAdjacentId] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [dragOrigin, setDragOrigin] = useState<{ pointerId: number; x: number; y: number; viewportX: number; viewportY: number } | null>(null);
  const slug = params?.slug;
  const selectedInput = useMemo(() => ({ slug: slug ?? "" }), [slug]);
  const { data: selected, isLoading: selectedLoading, isError: selectedIsError } = trpc.resources.getBySlug.useQuery(selectedInput, { enabled: Boolean(slug), retry: false, networkMode: "always" });
  const { data: matches } = trpc.resources.listFiltered.useQuery({ limit: 12, offset: 0, query, sort: "popular" }, { enabled: !slug && query.trim().length >= 2 });
  const graphInput = useMemo(() => ({ resourceId: selected?.id ?? 0, maxEdges: 40 }), [selected?.id]);
  const { data: graph, isLoading: graphLoading, isError: graphIsError } = trpc.graph.neighborhood.useQuery(graphInput, { enabled: Boolean(selected?.id), retry: false, networkMode: "always" });
  const relationshipLabel = (type: string) => ({ alternative_to: t("alternativeTo"), similar_to: t("similarTo"), integrates_with: t("integratesWith"), built_by: t("builtBy"), maintained_by: t("maintainedBy"), funded_by: t("fundedBy"), used_by: t("usedBy"), depends_on: t("dependsOn"), part_of: t("partOf"), competitor_of: t("competitorOf") }[type] ?? type);
  const nodesById = useMemo(() => new Map((graph?.nodes ?? []).map((node) => [node.id, node])), [graph?.nodes]);
  const relationshipTypes = useMemo(() => Array.from(new Set((graph?.edges ?? []).map((edge) => edge.type))), [graph?.edges]);
  const visibleEdges = useMemo(() => (graph?.edges ?? []).filter((edge) => activeType === "all" || edge.type === activeType), [activeType, graph?.edges]);
  const visibleNodes = useMemo(() => {
    const adjacentIds = new Set(visibleEdges.map((edge) => edge.sourceId === graph?.center.id ? edge.targetId : edge.sourceId));
    return (graph?.nodes ?? []).filter((node) => adjacentIds.has(node.id)).slice(0, NODE_POSITIONS.length);
  }, [graph?.center.id, graph?.nodes, visibleEdges]);
  const selectedNode = selectedAdjacentId ? nodesById.get(selectedAdjacentId) : undefined;
  const selectedConnection = useMemo(() => selectedAdjacentId ? visibleEdges.find((edge) => edge.sourceId === selectedAdjacentId || edge.targetId === selectedAdjacentId) : undefined, [selectedAdjacentId, visibleEdges]);
  const resetViewport = () => setViewport({ x: 0, y: 0, scale: 1 });
  const adjustZoom = (delta: number) => setViewport((current) => ({ ...current, scale: clampGraphScale(current.scale + delta) }));

  if (!slug) return <GraphSearch query={query} onQueryChange={setQuery} matches={matches?.items ?? []} onOpen={(resourceSlug) => setLocation(`/graph/${resourceSlug}`)} t={t} />;
  if (selectedLoading || (Boolean(selected?.id) && graphLoading)) return <GraphLoading />;
  if (selectedIsError || graphIsError || !selected || !graph) return <GraphUnavailable onChoose={() => setLocation("/graph")} t={t} />;

  return <div className="min-h-screen bg-transparent py-8 md:py-10"><div className="container max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href={`/resource/${selected.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900"><ArrowLeft className="h-4 w-4" />{t("graphBackToNode")}</Link><Button variant="outline" onClick={() => setLocation("/graph")}>{t("graphExploreOther")}</Button></div>
    <header className="mt-5"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{t("graphOneHop")}</p><h1 className="ns-page-title mt-2 text-slate-950">{selected.title} {t("graphEcosystemSuffix")}</h1><p className="ns-page-subtitle mt-3">{t("graphBoundedDescription")}</p></header>
    <section className="ns-noise ns-surface ns-glow-ring mt-7 overflow-hidden rounded-3xl border-sky-100 bg-[radial-gradient(circle_at_50%_45%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(145deg,#ffffff,#f7fbff)] p-4 md:p-6" aria-label={`${selected.title} ${t("graphRelationshipMap")}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4"><div><p className="text-sm font-semibold text-slate-900">Interactive one-hop map</p><p className="mt-1 text-xs text-slate-500">Drag the empty canvas to pan. Use the controls, mouse wheel, or arrow keys to explore.</p></div><div className="flex flex-wrap gap-2" aria-label={t("relationshipFilters")}><Button type="button" size="sm" variant={activeType === "all" ? "default" : "outline"} onClick={() => { setActiveType("all"); setSelectedAdjacentId(null); }}>All {graph.edges.length}</Button>{relationshipTypes.map((type) => <Button key={type} type="button" size="sm" variant={activeType === type ? "default" : "outline"} onClick={() => { setActiveType(type); setSelectedAdjacentId(null); }}>{relationshipLabel(type)}</Button>)}</div></div>
      <div
        className="relative mx-auto mt-5 min-h-[450px] max-w-5xl touch-none overflow-hidden rounded-2xl border border-sky-100 bg-white/60 outline-none"
        role="application"
        aria-label={`${selected.title} interactive relationship map`}
        tabIndex={0}
        onWheel={(event) => { event.preventDefault(); adjustZoom(event.deltaY > 0 ? -0.12 : 0.12); }}
        onPointerDown={(event) => { if (event.target !== event.currentTarget) return; event.currentTarget.setPointerCapture(event.pointerId); setDragOrigin({ pointerId: event.pointerId, x: event.clientX, y: event.clientY, viewportX: viewport.x, viewportY: viewport.y }); }}
        onPointerMove={(event) => { if (!dragOrigin || dragOrigin.pointerId !== event.pointerId) return; setViewport((current) => ({ ...current, x: dragOrigin.viewportX + event.clientX - dragOrigin.x, y: dragOrigin.viewportY + event.clientY - dragOrigin.y })); }}
        onPointerUp={(event) => { if (dragOrigin?.pointerId === event.pointerId) setDragOrigin(null); }}
        onPointerCancel={() => setDragOrigin(null)}
        onKeyDown={(event) => { const nudge = event.shiftKey ? 28 : 14; if (event.key === "ArrowLeft") { event.preventDefault(); setViewport((current) => ({ ...current, x: current.x - nudge })); } if (event.key === "ArrowRight") { event.preventDefault(); setViewport((current) => ({ ...current, x: current.x + nudge })); } if (event.key === "ArrowUp") { event.preventDefault(); setViewport((current) => ({ ...current, y: current.y - nudge })); } if (event.key === "ArrowDown") { event.preventDefault(); setViewport((current) => ({ ...current, y: current.y + nudge })); } if (event.key === "+" || event.key === "=") { event.preventDefault(); adjustZoom(0.12); } if (event.key === "-") { event.preventDefault(); adjustZoom(-0.12); } if (event.key === "0") { event.preventDefault(); resetViewport(); } }}
      >
        <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm"><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => adjustZoom(-0.12)} aria-label="Zoom out"><Minus className="h-4 w-4" /></Button><span className="min-w-11 text-center text-xs font-semibold text-slate-600">{Math.round(viewport.scale * 100)}%</span><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => adjustZoom(0.12)} aria-label="Zoom in"><Plus className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8" onClick={resetViewport} aria-label="Reset graph view"><RotateCcw className="h-4 w-4" /></Button></div>
        <div className={`absolute inset-0 ${dragOrigin ? "cursor-grabbing" : "cursor-grab"}`} style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`, transformOrigin: "50% 50%", transition: dragOrigin ? "none" : "transform 180ms var(--ns-ease-out)" }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{visibleNodes.map((node, index) => { const point = NODE_POSITIONS[index]; const isSelected = selectedAdjacentId === node.id; return <line key={node.id} x1="50" y1="50" x2={point.left} y2={point.top} className={isSelected ? "stroke-sky-500" : "stroke-sky-200"} strokeWidth={isSelected ? "0.55" : "0.35"} strokeDasharray={isSelected ? "0" : "1.4 1.2"} />; })}</svg>
          <Card className="absolute left-1/2 top-1/2 z-10 w-48 -translate-x-1/2 -translate-y-1/2 border-sky-300 bg-slate-950 p-5 text-white shadow-[0_16px_36px_rgba(15,23,42,0.28)]"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">{t("graphFocusNode")}</p><div className="mt-3 flex items-center gap-2"><ResourceIcon logo={graph.center.logo} title={graph.center.title} className="h-9 w-9 rounded-lg" /><h2 className="min-w-0 truncate text-base font-bold text-white">{graph.center.title}</h2></div></Card>
          {visibleNodes.map((node, index) => { const point = NODE_POSITIONS[index]; const isSelected = selectedAdjacentId === node.id; return <button key={node.id} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setSelectedAdjacentId(node.id)} className={`absolute z-20 w-32 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white/95 p-2.5 text-left shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:w-36 ${isSelected ? "border-sky-500 ring-2 ring-sky-200 shadow-[0_12px_24px_rgba(14,165,233,0.22)]" : "border-white hover:-translate-y-[55%] hover:border-sky-300 hover:shadow-lg"}`} style={{ left: `${point.left}%`, top: `${point.top}%` }} aria-pressed={isSelected}><span className="flex items-center gap-2"><ResourceIcon logo={node.logo} title={node.title} className="h-7 w-7 rounded-lg" /><span className="min-w-0 truncate text-xs font-semibold text-slate-700">{node.title}</span></span></button>; })}
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 z-30 flex items-center gap-2 rounded-lg bg-slate-950/80 px-3 py-2 text-xs font-medium text-white"><Maximize2 className="h-3.5 w-3.5 text-sky-300" />{visibleNodes.length} connected nodes · {visibleEdges.length} visible relationships</div>
      </div>
      {selectedNode && <Card className="mt-4 border-sky-200 bg-sky-50/70 p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><ResourceIcon logo={selectedNode.logo} title={selectedNode.title} className="h-10 w-10 rounded-xl" /><div><p className="font-semibold text-slate-950">{selectedNode.title}</p>{selectedConnection && <p className="mt-1 text-sm text-slate-600">{relationshipLabel(selectedConnection.type)} · {Math.round(Number(selectedConnection.strength) * 100)}% {t("graphStrength")}</p>}</div></div><div className="flex gap-2"><Link href={`/resource/${selectedNode.slug}`}><Button size="sm">{t("openNode")}</Button></Link><Button size="sm" variant="outline" onClick={() => setSelectedAdjacentId(null)} aria-label={t("clearSelectedNode")}><X className="h-4 w-4" /></Button></div></div></Card>}
    </section>
    <GraphRelationshipList edges={visibleEdges} nodesById={nodesById} centerId={graph.center.id} selectedTitle={selected.title} selectedAdjacentId={selectedAdjacentId} onSelect={setSelectedAdjacentId} relationshipLabel={relationshipLabel} t={t} />
  </div></div>;
}

function GraphSearch({ query, onQueryChange, matches, onOpen, t }: { query: string; onQueryChange: (value: string) => void; matches: any[]; onOpen: (slug: string) => void; t: Translate }) {
  return <div className="min-h-screen bg-transparent py-10 md:py-14"><div className="container max-w-4xl"><header className="ns-noise ns-surface rounded-3xl border-sky-100 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),transparent_40%),linear-gradient(135deg,#fff,#f8fbff)] p-6 shadow-sm md:p-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{t("graphExplorerKicker")}</p><h1 className="ns-page-title mt-3 text-slate-950">{t("graphExplorerTitle")}</h1><p className="ns-page-subtitle mt-3">{t("graphExplorerDescription")}</p><label className="relative mt-6 block max-w-xl"><span className="sr-only">{t("graphFindResource")}</span><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-600" /><Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("graphSearchPlaceholder")} className="h-12 rounded-2xl border-sky-200 bg-white pl-12 text-base shadow-sm" /></label></header>{query.trim().length >= 2 && <section className="mt-6">{matches.length ? <div className="grid gap-3 sm:grid-cols-2">{matches.map((resource) => <button type="button" key={resource.id} onClick={() => onOpen(resource.slug)} className="ns-hover-lift rounded-2xl border border-slate-200/90 bg-white/90 p-5 text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><span className="font-semibold text-slate-950">{resource.title}</span><span className="mt-2 block line-clamp-2 text-sm leading-6 text-slate-600">{resource.description || t("graphResourceFallbackDescription")}</span></button>)}</div> : <Card className="mt-5 p-8 text-center text-slate-600">{t("graphNoMatch")}</Card>}</section>}</div></div>;
}

function GraphLoading() { return <div className="container py-10 md:py-14"><div className="animate-pulse space-y-5"><div className="h-5 w-32 rounded bg-sky-100" /><div className="h-9 max-w-md rounded bg-slate-200" /><div className="h-[28rem] rounded-3xl border border-sky-100 bg-white/80" /></div><p className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-sky-600" />Loading verified graph relationships</p></div>; }

function GraphUnavailable({ onChoose, t }: { onChoose: () => void; t: Translate }) { return <div className="min-h-screen bg-transparent py-16"><div className="container max-w-2xl text-center"><Network className="mx-auto h-12 w-12 text-slate-300" /><h1 className="ns-page-title mt-5 text-slate-950">{t("graphUnavailable")}</h1><p className="ns-page-subtitle mx-auto mt-2">{t("graphUnavailableDescription")}</p><Button className="mt-6 bg-sky-600 text-white hover:bg-sky-700" onClick={onChoose}>{t("graphChooseOther")}</Button></div></div>; }

function GraphRelationshipList({ edges, nodesById, centerId, selectedTitle, selectedAdjacentId, onSelect, relationshipLabel, t }: { edges: any[]; nodesById: Map<number, any>; centerId: number; selectedTitle: string; selectedAdjacentId: number | null; onSelect: (id: number) => void; relationshipLabel: (type: string) => string; t: Translate }) {
  return <section className="mt-8"><div className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-sky-700" /><h2 className="text-xl font-semibold text-slate-950">{t("graphAccessibleList")}</h2></div><p className="mt-2 text-sm text-slate-600">{t("graphAccessibleListDescription")}</p>{edges.length ? <div className="mt-5 grid gap-3">{edges.map((edge) => { const adjacentId = edge.sourceId === centerId ? edge.targetId : edge.sourceId; const adjacent = nodesById.get(adjacentId); const isSelected = selectedAdjacentId === adjacentId; return <Card key={edge.id} className={`border-slate-200/90 bg-white/90 p-4 shadow-sm transition ${isSelected ? "ring-2 ring-sky-200" : "ns-hover-lift"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" className="min-w-0 text-left" onClick={() => onSelect(adjacentId)}><Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">{relationshipLabel(edge.type)}</Badge><p className="mt-2 font-semibold text-slate-950">{adjacent?.title || `#${adjacentId}`}</p><p className="mt-1 text-sm text-slate-600">{edge.sourceId === centerId ? t("graphOutgoingConnection") : t("graphIncomingConnection")} {selectedTitle}.</p>{edge.rationale && <p className="mt-2 text-sm leading-6 text-slate-600">{edge.rationale}</p>}</button><div className="flex items-center gap-3 text-sm text-slate-500 sm:text-right"><div><p>{Math.round(Number(edge.strength) * 100)}% {t("graphStrength")}</p><p className={edge.verified ? "mt-1 text-emerald-700" : "mt-1 text-amber-700"}>{edge.verified ? t("graphVerified") : t("graphPendingVerification")}</p></div>{edge.evidenceUrl && <a href={edge.evidenceUrl} target="_blank" rel="noreferrer" className="rounded-md p-2 text-sky-700 hover:bg-sky-50 hover:text-sky-900" aria-label={`${t("graphEvidence")} for ${adjacent?.title ?? "connection"}`}><ExternalLink className="h-4 w-4" /></a>}</div></div></Card>; })}</div> : <Card className="mt-5 p-10 text-center"><Network className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-semibold text-slate-950">{t("graphNoEdges")}</h3><p className="mt-2 text-sm text-slate-600">{t("graphNoEdgesDescription")}</p></Card>}</section>;
}
