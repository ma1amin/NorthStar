import { useEffect } from "react";
import { BookOpen, Code2, Github, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyClientSeo } from "@/lib/seo";

export default function Developer() {
  const { t } = useLanguage();
  useEffect(() => { applyClientSeo({ title: `${t("developer")} — NorthStar`, description: t("developerIntro"), canonicalPath: "/developer" }); }, [t]);
  return <div className="ns-noise min-h-screen py-10 md:py-14"><div className="container max-w-5xl"><header className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-xl md:p-10"><Code2 className="h-10 w-10 text-sky-300" /><p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">NorthStar</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">{t("developer")}</h1><p className="mt-3 max-w-2xl text-slate-300">{t("developerIntro")}</p></header><div className="mt-8 grid gap-4 md:grid-cols-2"><Card className="ns-hover-lift border-slate-200/90 bg-white/90 p-6 shadow-sm"><BookOpen className="h-6 w-6 text-sky-600" /><h2 className="mt-5 text-xl font-semibold text-slate-950">{t("apiBoundary")}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{t("apiBoundaryText")}</p><a href="https://github.com/ma1amin/NorthStar/blob/main/API.md" target="_blank" rel="noreferrer"><Button variant="outline" className="mt-5">{t("readApiDocs")}</Button></a></Card><Card className="ns-hover-lift border-slate-200/90 bg-white/90 p-6 shadow-sm"><ShieldCheck className="h-6 w-6 text-violet-600" /><h2 className="mt-5 text-xl font-semibold text-slate-950">{t("openSourceCollaboration")}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{t("openSourceText")}</p><a href="https://github.com/ma1amin/NorthStar" target="_blank" rel="noreferrer"><Button variant="outline" className="mt-5"><Github className="mr-2 h-4 w-4" />GitHub</Button></a></Card></div></div></div>;
}
