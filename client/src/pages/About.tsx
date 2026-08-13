import { useEffect } from "react";
import { Compass, Network, ShieldCheck, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyClientSeo } from "@/lib/seo";

export default function About() {
  const { t } = useLanguage();
  useEffect(() => { applyClientSeo({ title: `${t("about")} — NorthStar`, description: t("aboutIntro"), canonicalPath: "/about" }); }, [t]);
  const principles = [{ icon: Compass, title: t("explore"), text: t("aboutMissionText") }, { icon: Network, title: t("knowledgeGraph"), text: t("relationshipAfterModeration") }, { icon: UsersRound, title: t("humanOversight"), text: t("contributionReview") }, { icon: ShieldCheck, title: t("trustContext"), text: t("feedbackGuidance") }];
  return <div className="ns-noise min-h-screen py-10 md:py-14"><div className="container max-w-5xl"><section className="rounded-3xl border border-violet-100 bg-[radial-gradient(circle_at_top_right,_rgba(196,181,253,0.3),transparent_45%),linear-gradient(135deg,#fff,#fafaff)] p-7 shadow-sm md:p-10"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">NorthStar</p><h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{t("aboutMission")}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{t("aboutIntro")}</p><p className="mt-4 max-w-3xl text-slate-600">{t("aboutMissionText")}</p></section><section className="mt-10"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">{t("aboutPrinciples")}</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{principles.map((item) => { const Icon = item.icon; return <Card key={item.title} className="ns-hover-lift border-slate-200/90 bg-white/90 p-6 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Icon className="h-5 w-5" /></div><h2 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></Card>; })}</div></section></div></div>;
}
