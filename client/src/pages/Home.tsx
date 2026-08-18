import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight, Command, Compass, FolderOpen, GitBranch, Network, Pause, Play, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { applyClientSeo } from "@/lib/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { ResourceIcon } from "@/components/ResourceIcon";
import { nextFeaturedIndex, previousFeaturedIndex } from "@/lib/featuredCarousel";

export default function Home() {
  const { isAuthenticated, startLogin } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredPaused, setFeaturedPaused] = useState(false);
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: featuredResponse, isLoading: featuredLoading } = trpc.resources.listFiltered.useQuery({ limit: 12, offset: 0, sort: "popular" });
  const featuredResources = featuredResponse?.items ?? [];
  const featuredResource = featuredResources[featuredIndex] ?? featuredResources[0];
  const featuredCategory = useMemo(() => categories.find((category) => category.id === featuredResource?.categoryId), [categories, featuredResource?.categoryId]);
  const graphSignals = [
    { query: "alternatives", label: t("alternatives"), tone: "bg-sky-50 text-sky-700 ring-sky-100" },
    { query: "integrations", label: t("integrations"), tone: "bg-violet-50 text-violet-700 ring-violet-100" },
    { query: "competitors", label: t("competitors"), tone: "bg-amber-50 text-amber-700 ring-amber-100" },
    { query: "ecosystem", label: t("ecosystem"), tone: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  ];

  useEffect(() => {
    applyClientSeo({ title: "NorthStar — Resource Intelligence Platform", description: "Discover, compare, and organize digital resources through verified knowledge-graph relationships.", canonicalPath: "/" });
  }, []);

  useEffect(() => {
    if (featuredIndex >= featuredResources.length && featuredResources.length) setFeaturedIndex(0);
  }, [featuredIndex, featuredResources.length]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (featuredPaused || reducedMotion.matches || featuredResources.length < 2) return undefined;
    const timer = window.setInterval(() => setFeaturedIndex((current) => nextFeaturedIndex(current, featuredResources.length)), 3000);
    return () => window.clearInterval(timer);
  }, [featuredPaused, featuredResources.length]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="overflow-hidden bg-transparent">
      <section className="ns-noise relative isolate border-b border-slate-200/80 bg-white/80">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><div className="ns-grid-backdrop absolute inset-0 opacity-70" /><div className="absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-sky-200/45 blur-3xl" /><div className="absolute -bottom-56 left-[12%] h-[30rem] w-[30rem] rounded-full bg-violet-200/35 blur-3xl" /><div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-50 to-transparent" /></div>
        <div className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] lg:py-28">
          <div className="max-w-3xl">
            <div className="ns-glow-ring inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-sm"><Sparkles className="h-3.5 w-3.5" />{t("resourceIntelligenceNotLinks")}</div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">{t("discoverResourcesContext")}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{t("homeHeroDescription")}</p>
            <form onSubmit={handleSearch} className="animate-fade-in-up mt-8 max-w-2xl"><div className="ns-surface-strong rounded-2xl border border-slate-200/90 bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.09)] transition-shadow focus-within:border-sky-300 focus-within:shadow-[0_16px_40px_rgba(14,165,233,0.15)]"><div className="flex items-center gap-2"><Search className="ml-2 h-5 w-5 shrink-0 text-sky-600" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-11 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0" placeholder={t("homeSearchPlaceholder")} aria-label={t("homeSearchAria")} /><Button type="submit" className="h-11 rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-800">{t("search")} <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>{t("relationshipShortcuts")}</span>{graphSignals.slice(0, 3).map((signal) => <button type="button" key={signal.query} onClick={() => setSearchQuery(signal.query)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-700">{signal.label}</button>)}</div></form>
            <div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => setLocation("/browse")} className="h-11 rounded-xl bg-sky-600 px-5 text-white hover:bg-sky-700"><Compass className="mr-2 h-4 w-4" />{t("exploreResources")}</Button><Button variant="outline" onClick={() => isAuthenticated ? setLocation("/submit") : startLogin()} className="h-11 rounded-xl border-slate-300 bg-white px-5 text-slate-700 hover:bg-slate-50">{isAuthenticated ? t("contributeResource") : t("signInToContribute")}</Button></div>
          </div>

          <div className="animate-slide-in-right relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end" onMouseEnter={() => setFeaturedPaused(true)} onMouseLeave={() => setFeaturedPaused(false)} onFocusCapture={() => setFeaturedPaused(true)} onBlurCapture={() => setFeaturedPaused(false)}>
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-100 via-white to-violet-100 blur-2xl" />
            <Card className="ns-hover-lift overflow-hidden rounded-2xl border-slate-200/90 bg-white p-0 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white"><Network className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-slate-900">{t("resourceNode")}</p><p className="text-[11px] text-slate-500">{t("connectedKnowledgeObject")}</p></div></div><div className="flex items-center gap-1.5"><button type="button" onClick={() => setFeaturedPaused((paused) => !paused)} className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" aria-label={featuredPaused ? t("resumeFeaturedResources") : t("pauseFeaturedResources")}>{featuredPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{t("verifiedGraph")}</span></div></div>
              <div className="min-h-[274px] p-5">{featuredLoading ? <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4"><div className="h-3 w-24 rounded bg-slate-100" /><div className="mt-4 h-8 w-40 rounded bg-slate-100" /><div className="mt-4 h-4 w-full rounded bg-slate-100" /><div className="mt-2 h-4 w-4/5 rounded bg-slate-100" /></div> : featuredResource ? <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-4" key={featuredResource.id}><div className="flex items-start gap-3"><ResourceIcon logo={featuredResource.logo} title={featuredResource.title} className="h-11 w-11 rounded-xl" /><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-700">{featuredCategory?.name ?? t("resourceNode")}</p><h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-950">{featuredResource.title}</h2></div></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{featuredResource.description || t("resourceGraphDescription")}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{featuredResource.pricing.replace("_", " ")}</span><span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">{t("approved")}</span></div></div> : <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">{t("resourceUnavailable")}</div>}<div className="mt-4 flex items-center justify-between"><div className="flex gap-1.5" role="tablist" aria-label={t("featuredApprovedResources")}>{featuredResources.map((resource, index) => <button key={resource.id} type="button" onClick={() => setFeaturedIndex(index)} className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${index === featuredIndex ? "w-5 bg-sky-600" : "w-2 bg-slate-200 hover:bg-sky-300"}`} aria-label={`${t("openNode")}: ${resource.title}`} aria-selected={index === featuredIndex} />)}</div><div className="flex gap-1"><button type="button" onClick={() => setFeaturedIndex((current) => previousFeaturedIndex(current, featuredResources.length))} disabled={!featuredResources.length} className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-sky-700 disabled:opacity-40" aria-label={t("previousFeaturedResource")}><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setFeaturedIndex((current) => nextFeaturedIndex(current, featuredResources.length))} disabled={!featuredResources.length} className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-sky-700 disabled:opacity-40" aria-label={t("nextFeaturedResource")}><ChevronRight className="h-4 w-4" /></button></div></div></div>
              <button type="button" disabled={!featuredResource} onClick={() => featuredResource && setLocation(`/resource/${featuredResource.slug}`)} className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-3 text-left text-xs text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed"><span>{t("builtForGraphNavigation")}</span><span className="inline-flex items-center gap-1 font-semibold text-sky-700">{t("openNode")} <ArrowRight className="h-3.5 w-3.5" /></span></button>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-14 md:py-20"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">{t("discoveryPaths")}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t("homeQuestionTitle")}</h2></div><Button variant="ghost" onClick={() => setLocation("/search")} className="w-fit px-0 text-sky-700 hover:bg-transparent hover:text-sky-900">{t("openRelationshipSearch")} <ArrowRight className="ml-2 h-4 w-4" /></Button></div><div className="mt-8 grid gap-4 md:grid-cols-3"><DiscoveryCard icon={Search} title={t("findRightTool")} description={t("findToolDescription")} action={t("searchGraph")} onClick={() => setLocation("/search")} tone="sky" /><DiscoveryCard icon={GitBranch} title={t("traceConnections")} description={t("traceConnectionsDescription")} action={t("browseNodes")} onClick={() => setLocation("/browse")} tone="violet" /><DiscoveryCard icon={FolderOpen} title={t("buildUsefulStack")} description={t("buildStackDescription")} action={t("viewCollections")} onClick={() => setLocation("/collections")} tone="emerald" /></div></section>

      <section className="border-y border-slate-200 bg-white"><div className="container py-14 md:py-20"><div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">{t("graphBenefits")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{t("graphBenefitsTitle")}</h2><p className="mt-4 max-w-lg text-slate-600">{t("graphBenefitsDescription")}</p></div><div className="grid gap-3 sm:grid-cols-2">{[{ title: t("understandTradeoffs"), description: t("tradeoffsDescription") }, { title: t("discoverConnections"), description: t("connectionsDescription") }, { title: t("keepKnowledgeReusable"), description: t("knowledgeReusableDescription") }, { title: t("contributeWithReview"), description: t("contributeReviewDescription") }].map((item, index) => <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-sm">0{index + 1}</span><h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></div>)}</div></div></div></section>

      <section className="container py-14 md:py-20"><div className="ns-noise ns-hover-lift rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] md:px-10 md:py-14"><div className="grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">{t("makeGraphStronger")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{t("graphStrongerTitle")}</h2><p className="mt-4 max-w-2xl text-slate-300">{t("graphStrongerDescription")}</p></div><Button onClick={() => isAuthenticated ? setLocation("/submit") : startLogin()} className="h-11 rounded-xl bg-white px-5 text-slate-900 hover:bg-slate-100">{isAuthenticated ? t("submitAResource") : t("signInToContribute")}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></div></section>
    </div>
  );
}

function DiscoveryCard({ icon: Icon, title, description, action, onClick, tone }: { icon: typeof Search; title: string; description: string; action: string; onClick: () => void; tone: "sky" | "violet" | "emerald" }) {
  const styles = { sky: "bg-sky-50 text-sky-700", violet: "bg-violet-50 text-violet-700", emerald: "bg-emerald-50 text-emerald-700" };
  return <Card className="ns-hover-lift group rounded-2xl border-slate-200/90 bg-white/90 p-6 shadow-sm"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-xl font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p><Button variant="ghost" onClick={onClick} className="mt-4 px-0 text-sky-700 hover:bg-transparent hover:text-sky-900">{action}<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Card>;
}
