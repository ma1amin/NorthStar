import { useLocation } from "wouter";
import { ArrowRight, BarChart3, Loader2, Search, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyClientSeo } from "@/lib/seo";
import { useEffect } from "react";

export default function Trending() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: trending = [], isLoading } = trpc.search.getTrending.useQuery({ limit: 12 });
  useEffect(() => { applyClientSeo({ title: `${t("trending")} — NorthStar`, description: t("trendingIntro"), canonicalPath: "/trending" }); }, [t]);
  return <div className="ns-noise min-h-screen py-10 md:py-14"><div className="container max-w-5xl"><header className="rounded-3xl border border-sky-100 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.2),transparent_40%),linear-gradient(135deg,#fff,#f8fbff)] p-7 shadow-sm md:p-10"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg"><BarChart3 className="h-5 w-5" /></div><p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">{t("popularNow")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{t("trending")}</h1><p className="mt-3 max-w-2xl text-slate-600">{t("trendingIntro")}</p></header>{isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /></div> : trending.length ? <section className="mt-8 grid gap-4 md:grid-cols-2">{trending.map((title: string, index: number) => <Card key={title} className="ns-hover-lift flex items-center gap-4 border-slate-200/90 bg-white/90 p-5 shadow-sm"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-bold text-sky-700">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{t("popularNow")}</p></div><Button variant="ghost" size="icon" className="shrink-0 text-sky-700 hover:bg-sky-50" aria-label={`${t("search")} ${title}`} onClick={() => setLocation(`/search?q=${encodeURIComponent(title)}`)}><Search className="h-4 w-4" /></Button></Card>)}</section> : <Card className="ns-surface mt-8 p-10 text-center shadow-sm"><Sparkles className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="mx-auto max-w-xl text-slate-600">{t("trendingEmpty")}</p><Button className="mt-5 bg-sky-600 text-white hover:bg-sky-700" onClick={() => setLocation("/browse")}>{t("exploreMore")}<ArrowRight className="ml-2 h-4 w-4" /></Button></Card>}</div></div>;
}
