import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Command, Compass, FolderOpen, GitBranch, Network, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const graphSignals = [
  { label: "Alternatives", tone: "bg-sky-50 text-sky-700 ring-sky-100" },
  { label: "Integrations", tone: "bg-violet-50 text-violet-700 ring-violet-100" },
  { label: "Competitors", tone: "bg-amber-50 text-amber-700 ring-amber-100" },
  { label: "Ecosystems", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: categories = [] } = trpc.categories.list.useQuery();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="overflow-hidden bg-[#f8fafc]">
      <section className="relative isolate border-b border-slate-200/80 bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><div className="absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-sky-200/45 blur-3xl" /><div className="absolute -bottom-56 left-[12%] h-[30rem] w-[30rem] rounded-full bg-violet-200/35 blur-3xl" /><div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-50 to-transparent" /></div>
        <div className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> Resource intelligence, not link collecting</div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">Discover resources in <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600">context.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">NorthStar connects digital tools through verified relationships, so every search can lead to alternatives, integrations, dependencies, and the surrounding ecosystem.</p>
            <form onSubmit={handleSearch} className="mt-8 max-w-2xl"><div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.09)] transition-shadow focus-within:border-sky-300 focus-within:shadow-[0_16px_40px_rgba(14,165,233,0.15)]"><div className="flex items-center gap-2"><Search className="ml-2 h-5 w-5 shrink-0 text-sky-600" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-11 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0" placeholder="Try “Jira alternatives” or “Figma integrations”" aria-label="Search the NorthStar resource graph" /><Button type="submit" className="h-11 rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-800">Search <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Relationship-aware shortcuts:</span>{graphSignals.slice(0, 3).map((signal) => <button type="button" key={signal.label} onClick={() => setSearchQuery(signal.label.toLowerCase())} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-700">{signal.label}</button>)}</div></form>
            <div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => setLocation("/browse")} className="h-11 rounded-xl bg-sky-600 px-5 text-white hover:bg-sky-700"><Compass className="mr-2 h-4 w-4" />Explore resources</Button><Button variant="outline" onClick={() => isAuthenticated ? setLocation("/submit") : (window.location.href = getLoginUrl())} className="h-11 rounded-xl border-slate-300 bg-white px-5 text-slate-700 hover:bg-slate-50">{isAuthenticated ? "Contribute a resource" : "Sign in to contribute"}</Button></div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-100 via-white to-violet-100 blur-2xl" />
            <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white"><Network className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-slate-900">Resource node</p><p className="text-[11px] text-slate-500">Connected knowledge object</p></div></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Verified graph</span></div>
              <div className="p-5"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-700">Design & collaboration</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Figma</h2><p className="mt-2 text-sm leading-6 text-slate-600">A collaborative design platform with a discoverable relationship map.</p><div className="mt-4 flex flex-wrap gap-2">{graphSignals.map((signal) => <span key={signal.label} className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${signal.tone}`}>{signal.label}</span>)}</div></div><div className="mt-4 grid grid-cols-3 gap-2">{[{ label: "Alternatives", value: "12" }, { label: "Integrations", value: "38" }, { label: "Signals", value: "Verified" }].map((item) => <div key={item.label} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{item.value}</p></div>)}</div></div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>Built for graph navigation</span><span className="inline-flex items-center gap-1 font-semibold text-sky-700">Open node <ArrowRight className="h-3.5 w-3.5" /></span></div>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-14 md:py-20"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Discovery paths</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Start with the question you have.</h2></div><Button variant="ghost" onClick={() => setLocation("/search")} className="w-fit px-0 text-sky-700 hover:bg-transparent hover:text-sky-900">Open relationship search <ArrowRight className="ml-2 h-4 w-4" /></Button></div><div className="mt-8 grid gap-4 md:grid-cols-3"><DiscoveryCard icon={Search} title="Find the right tool" description="Search by name, use case, category, or the relationship you want to understand." action="Search the graph" onClick={() => setLocation("/search")} tone="sky" /><DiscoveryCard icon={GitBranch} title="Trace the connections" description="Move from a resource to its alternatives, integrations, competitors, and ecosystem." action="Browse nodes" onClick={() => setLocation("/browse")} tone="violet" /><DiscoveryCard icon={FolderOpen} title="Build a useful stack" description="Save, curate, and share collections that preserve the context behind your choices." action="View collections" onClick={() => setLocation("/collections")} tone="emerald" /></div></section>

      <section className="border-y border-slate-200 bg-white"><div className="container py-14 md:py-20"><div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">How the graph helps</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">A calmer way to evaluate a crowded tool landscape.</h2><p className="mt-4 max-w-lg text-slate-600">NorthStar turns a directory into an intelligence layer. Each resource is designed to carry clear metadata, relationship context, community signals, and a route into its broader ecosystem.</p></div><div className="grid gap-3 sm:grid-cols-2">{[{ title: "Understand trade-offs", description: "Compare credible alternatives without restarting research from scratch." }, { title: "Discover connections", description: "Surface integrations and dependencies that affect real workflows." }, { title: "Keep knowledge reusable", description: "Turn individual findings into collections your team can revisit." }, { title: "Contribute with review", description: "Submit resources and relationship suggestions through a human moderation loop." }].map((item, index) => <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-sm">0{index + 1}</span><h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></div>)}</div></div></div></section>

      <section className="container py-14 md:py-20"><div className="rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] md:px-10 md:py-14"><div className="grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">Make the graph stronger</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Have a resource or relationship worth mapping?</h2><p className="mt-4 max-w-2xl text-slate-300">Contributions are reviewed by people before they become public knowledge. Start with a resource, then add the context that makes it useful.</p></div><Button onClick={() => isAuthenticated ? setLocation("/submit") : (window.location.href = getLoginUrl())} className="h-11 rounded-xl bg-white px-5 text-slate-900 hover:bg-slate-100">{isAuthenticated ? "Submit a resource" : "Sign in to contribute"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></div></section>
    </div>
  );
}

function DiscoveryCard({ icon: Icon, title, description, action, onClick, tone }: { icon: typeof Search; title: string; description: string; action: string; onClick: () => void; tone: "sky" | "violet" | "emerald" }) {
  const styles = { sky: "bg-sky-50 text-sky-700", violet: "bg-violet-50 text-violet-700", emerald: "bg-emerald-50 text-emerald-700" };
  return <Card className="group rounded-2xl border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-xl font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p><Button variant="ghost" onClick={onClick} className="mt-4 px-0 text-sky-700 hover:bg-transparent hover:text-sky-900">{action}<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Card>;
}
