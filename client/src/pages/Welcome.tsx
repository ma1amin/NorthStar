import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, Compass, FilePenLine, LogIn, Network, UserRound } from "lucide-react";
import { useLocation } from "wouter";

export default function Welcome() {
  const { user, isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const [, setLocation] = useLocation();
  const ar = locale === "ar";
  const steps = ar ? [
    { icon: UserRound, title: "أنشئ ملفك الشخصي", description: "أضف اسماً ظاهراً وسياقاً مختصراً لتكون مساهماتك واضحة الملكية." },
    { icon: Compass, title: "اكتشف ضمن السياق", description: "تصفّح الموارد وابحث في العلاقات واستكشف الأنظمة المتصلة." },
    { icon: FilePenLine, title: "ساهم بعناية", description: "أرسل الموارد والتعديلات والعلاقات للمراجعة البشرية، لا للنشر التلقائي." },
  ] : [
    { icon: UserRound, title: "Shape your profile", description: "Add a display name and short context so your contributions have clear ownership." },
    { icon: Compass, title: "Discover in context", description: "Browse resources, search relationship intent, and inspect connected ecosystems." },
    { icon: FilePenLine, title: "Contribute carefully", description: "Submit resources, edits, and relationships for human moderation—not automatic publication." },
  ];
  return <div className="min-h-screen bg-[radial-gradient(circle_at_85%_5%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_15%_40%,rgba(167,139,250,0.14),transparent_28%),#f8fafc] py-10 md:py-16"><div className="container max-w-5xl"><header className="mx-auto max-w-3xl text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 text-white shadow-[0_16px_36px_rgba(37,99,235,0.28)]"><Network className="h-7 w-7" /></div><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{ar ? "مرحباً بك في نورث ستار" : "Welcome to NorthStar"}</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{ar ? "ابنِ ذكاءً أفضل للموارد معاً." : "Build better resource intelligence together."}</h1><p className="mt-5 text-lg leading-8 text-slate-600">{ar ? "يستخدم نورث ستار حسابك المتصل لتسجيل الدخول وينشئ ملف العضو عند أول وصول. تخضع مساهمات المجتمع دائماً للمراجعة قبل أن تؤثر في الرسم البياني العام للمعرفة." : "NorthStar uses your connected account for sign-in and creates a member profile on first access. Community contributions are always reviewed before they affect the public knowledge graph."}</p></header>{isAuthenticated ? <Card className="mx-auto mt-10 max-w-3xl border-emerald-200 bg-white/90 p-7 shadow-xl shadow-sky-100/50 md:p-9"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">{ar ? "تم تسجيل دخولك" : "You’re signed in"}</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">{ar ? `مرحباً، ${user?.name || "عضو نورث ستار"}.` : `Welcome, ${user?.name || "NorthStar member"}.`}</h2><p className="mt-2 text-slate-600">{ar ? "حسابك جاهز. اختر خطوتك التالية." : "Your account is ready. Choose your next step below."}</p></div><CheckCircle2 className="h-12 w-12 text-emerald-500" /></div><div className="mt-7 grid gap-3 sm:grid-cols-3"><Button onClick={() => setLocation("/profile")} className="bg-slate-950 text-white hover:bg-slate-800"><UserRound className="me-2 h-4 w-4" />{ar ? "الملف الشخصي" : "Profile"}</Button><Button variant="outline" onClick={() => setLocation("/browse")}><Compass className="me-2 h-4 w-4" />{ar ? "استكشاف" : "Explore"}</Button><Button variant="outline" onClick={() => setLocation("/submit")}><FilePenLine className="me-2 h-4 w-4" />{ar ? "مساهمة" : "Contribute"}</Button></div></Card> : <div className="mx-auto mt-10 flex justify-center"><Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="rounded-xl bg-slate-950 px-6 text-white shadow-lg hover:bg-slate-800"><LogIn className="me-2 h-5 w-5" />{ar ? "سجّل الدخول أو أنشئ ملف العضو" : "Sign in or create your member profile"}</Button></div>}<section className="mt-12 grid gap-5 md:grid-cols-3">{steps.map((step) => { const Icon = step.icon; return <Card key={step.title} className="border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur"><Icon className="h-6 w-6 text-sky-600" /><h2 className="mt-5 text-lg font-semibold text-slate-950">{step.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p></Card>; })}</section></div></div>;
}
