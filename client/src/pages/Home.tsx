import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Compass, FolderOpen, GitBranch, Network, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { applyClientSeo } from "@/lib/seo";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { isAuthenticated, startLogin } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: featuredPage } = trpc.resources.listFiltered.useQuery({ limit: 1, offset: 0, sort: "popular" });
  const preview = featuredPage?.items?.[0];
  const graphSignals = [
    { query: "alternatives", label: t("alternatives"), tone: "bg-sky-50 text-sky-700 ring-sky-100" },
    { query: "integrations", label: t("integrations"), tone: "bg-violet-50 text-violet-700 ring-violet-100" },
    { query: "competitors", label: t("competitors"), tone: "bg-amber-50 text-amber-700 ring-amber-100" },
    { query: "ecosystem", label: t("ecosystem"), tone: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  ];

  useEffect(() => {
    applyClientSeo({ title: "NorthStar — Resource Intelligence Platform", description: "Discover, compare, and organize digital resources through verified knowledge-graph relationships.", canonicalPath: "/" });
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return <div className="overflow-hidden bg-transparent">
    <section className="ns-noise ns-surface relative isolate overflow-hidden border-x-0 border-t-0">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><div className="ns-grid-backdrop absolute inset-0 opacity-70" /><div className="absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-sky-300/25 blur-3xl dark:bg-cyan-500/10" /><div className="absolute -bottom-56 left-[12%] h-[30rem] w-[30rem] rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" /></div>
      <div className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] lg:py-28">
        <div className="max-w-3xl"><div className="ns-glow-ring inline-flex items-center gap-2 rounded-full border border-sky-200 bg-[var(--ns-surface-strong)] px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-sm"><Sparkles className="h-3.5 w-3.5" />{t("resourceIntelligenceNotLinks")}</div><h1 className="mt-6 max-w-3xl text-4xl sm:text-5xl lg:text-6xl">{t("discoverResourcesContext")}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ns-muted)]">{t("homeHeroDescription")}</p>
          <form onSubmit={handleSearch} className="animate-fade-in-up mt-8 max-w-2xl"><div className="ns-surface-strong rounded-2xl p-2 transition-shadow focus-within:border-sky-300 focus-within:shadow-[0_16px_40px_rgba(14,165,233,0.15)]"><div className="flex items-center gap-2"><Search className="ml-2 h-5 w-5 shrink-0 text-sky-600" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-11 border-0 bg-transparent px-1 text-base text-[var(--ns-ink)] shadow-none focus-visible:ring-0" placeholder={t("homeSearchPlaceholder")} aria-label={t("homeSearchAria")} /><Button type="submit" className="ns-primary-button h-11 rounded-xl px-4">{t("search")} <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--ns-muted)]"><span>{t("relationshipShortcuts")}</span>{graphSignals.slice(0, 3).map((signal) => <button type="button" key={signal.query} onClick={() => setSearchQuery(signal.query)} className="rounded-full border border-[var(--ns-border-strong)] bg-[var(--ns-elevated)] px-2.5 py-1 font-medium text-[var(--ns-muted)] transition hover:border-sky-200 hover:text-sky-700">{signal.label}</button>)}</div></form>
          <div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => setLocation("/browse")} className="h-11 rounded-xl bg-sky-600 px-5 text-white hover:bg-sky-700"><Compass className="mr-2 h-4 w-4" />{t("exploreResources")}</Button><Button variant="outline" onClick={() => isAuthenticated ? setLocation("/capture") : startLogin()} className="h-11 rounded-xl border-[var(--ns-border-strong)] bg-[var(--ns-elevated)] px-5 text-[var(--ns-ink)] hover:bg-[var(--ns-control-hover)]">{isAuthenticated ? t("captureResources") : t("signInToContribute")}</Button></div>
        </div>

        <div className="animate-slide-in-right relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end"><div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-200/35 via-transparent to-violet-200/35 blur-2xl" /><Card className="ns-hover-lift ns-surface-strong overflow-hidden rounded-3xl p-0"><div className="flex items-center justify-between border-b border-[var(--ns-line)] bg-[var(--ns-elevated)] px-5 py-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white"><Network className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-[var(--ns-ink)]">{t("resourceNode")}</p><p className="text-[11px] text-[var(--ns-muted)]">{t("connectedKnowledgeObject")}</p></div></div><span className="badge-success">{t("verifiedGraph")}</span></div><div className="p-5"><div className="rounded-2xl border border-[var(--ns-border-strong)] bg-[var(--ns-elevated)] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-700">{preview?.categoryName ?? t("resourceDirectory")}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ns-ink)]">{preview?.title ?? t("resourceDirectory")}</h2><p className="mt-2 text-sm leading-6 text-[var(--ns-muted)]">{preview?.description || t("resourceGraphDescription")}</p><div className="mt-4 flex flex-wrap gap-2">{graphSignals.map((signal) => <span key={signal.query} className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${signal.tone}`}>{signal.label}</span>)}</div></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[var(--ns-elevated)] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ns-muted)]">{t("category")}</p><p className="mt-1 text-sm font-semibold capitalize text-[var(--ns-ink)]">{preview?.subcategoryName ?? t("resourceNode")}</p></div><div className="rounded-xl bg-[var(--ns-elevated)] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ns-muted)]">{t("pricing")}</p><p className="mt-1 text-sm font-semibold capitalize text-[var(--ns-ink)]">{preview?.pricing?.replace("_", " ") ?? t("notSpecified")}</p></div></div></div><button type="button" onClick={() => setLocation(preview ? `/graph/${preview.slug}` : "/graph")} className="flex w-full items-center justify-between border-t border-[var(--ns-line)] px-5 py-3 text-left text-xs text-[var(--ns-muted)] transition hover:bg-[var(--ns-control-hover)]"><span>{t("builtForGraphNavigation")}</span><span className="inline-flex items-center gap-1 font-semibold text-sky-700">{t("openGraph")} <ArrowRight className="h-3.5 w-3.5" /></span></button></Card></div>
      </div>
    </section>

    <section className="container py-14 md:py-20"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">{t("discoveryPaths")}</p><h2 className="mt-2 text-3xl">{t("homeQuestionTitle")}</h2></div><Button variant="ghost" onClick={() => setLocation("/search")} className="w-fit px-0 text-sky-700 hover:bg-transparent hover:text-sky-900">{t("openRelationshipSearch")} <ArrowRight className="ml-2 h-4 w-4" /></Button></div><div className="mt-8 grid gap-4 md:grid-cols-3"><DiscoveryCard icon={Search} title={t("findRightTool")} description={t("findToolDescription")} action={t("searchGraph")} onClick={() => setLocation("/search")} tone="sky" /><DiscoveryCard icon={GitBranch} title={t("traceConnections")} description={t("traceConnectionsDescription")} action={t("browseNodes")} onClick={() => setLocation("/graph")} tone="violet" /><DiscoveryCard icon={FolderOpen} title={t("buildUsefulStack")} description={t("buildStackDescription")} action={t("viewCollections")} onClick={() => setLocation("/collections")} tone="emerald" /></div></section>

    <section className="border-y border-[var(--ns-line)] bg-[var(--ns-elevated)]"><div className="container py-14 md:py-20"><div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">{t("graphBenefits")}</p><h2 className="mt-3 text-3xl">{t("graphBenefitsTitle")}</h2><p className="mt-4 max-w-lg text-[var(--ns-muted)]">{t("graphBenefitsDescription")}</p></div><div className="grid gap-3 sm:grid-cols-2">{[{ title: t("understandTradeoffs"), description: t("tradeoffsDescription") }, { title: t("discoverConnections"), description: t("connectionsDescription") }, { title: t("keepKnowledgeReusable"), description: t("knowledgeReusableDescription") }, { title: t("contributeWithReview"), description: t("contributeReviewDescription") }].map((item, index) => <div key={item.title} className="ns-surface-strong rounded-2xl p-5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ns-elevated)] text-xs font-bold text-[var(--ns-muted)] shadow-sm">0{index + 1}</span><h3 className="mt-4 text-lg font-semibold text-[var(--ns-ink)]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--ns-muted)]">{item.description}</p></div>)}</div></div></div></section>

    <section className="container py-14 md:py-20"><div className="ns-noise ns-hover-lift rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] md:px-10 md:py-14"><div className="grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">{t("makeGraphStronger")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{t("graphStrongerTitle")}</h2><p className="mt-4 max-w-2xl text-slate-300">{t("graphStrongerDescription")}</p></div><Button onClick={() => isAuthenticated ? setLocation("/capture") : startLogin()} className="h-11 rounded-xl bg-white px-5 text-slate-900 hover:bg-slate-100">{isAuthenticated ? t("captureResources") : t("signInToContribute")}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></div></section>
  </div>;
}

function DiscoveryCard({ icon: Icon, title, description, action, onClick, tone }: { icon: typeof Search; title: string; description: string; action: string; onClick: () => void; tone: "sky" | "violet" | "emerald" }) {
  const styles = { sky: "bg-sky-50 text-sky-700", violet: "bg-violet-50 text-violet-700", emerald: "bg-emerald-50 text-emerald-700" };
  return <Card className="ns-hover-lift ns-surface-strong group rounded-2xl p-6"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-xl font-semibold text-[var(--ns-ink)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--ns-muted)]">{description}</p><Button variant="ghost" onClick={onClick} className="mt-4 px-0 text-sky-700 hover:bg-transparent hover:text-sky-900">{action}<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Card>;
}
