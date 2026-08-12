import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Loader2, Plus, ArrowUpRight, LockKeyhole, Globe2, Layers3 } from "lucide-react";

export default function Collections() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPublic: true });
  const { data: collections = [], isLoading } = trpc.collections.list.useQuery({ limit: 100, offset: 0 });
  const publicCollectionCount = collections.filter((collection: any) => collection.isPublic).length;
  const createCollection = trpc.collections.create.useMutation({
    onSuccess: async (collection) => {
      await utils.collections.list.invalidate();
      setForm({ name: "", description: "", isPublic: true });
      setShowCreate(false);
      setLocation(`/collection/${collection.id}`);
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    createCollection.mutate({ name: form.name.trim(), description: form.description.trim() || undefined, isPublic: form.isPublic });
  };

  return (
    <div className="ns-noise min-h-screen bg-transparent py-10 md:py-14">
      <div className="container max-w-5xl">
        <div className="animate-fade-in-up mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Curated knowledge</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Collections</h1><p className="mt-3 max-w-2xl text-slate-600">Build shareable stacks that make a domain easier to understand, compare, and revisit.</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold"><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm ring-1 ring-slate-200"><Layers3 className="h-3.5 w-3.5 text-sky-600" /> {isLoading ? "Loading stacks" : `${collections.length} stack${collections.length === 1 ? "" : "s"}`}</span>{!isLoading && publicCollectionCount > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-100"><Globe2 className="h-3.5 w-3.5" /> {publicCollectionCount} shareable</span>}</div></div>
          <Button onClick={() => setShowCreate((value) => !value)} className="rounded-xl bg-sky-600 text-white shadow-[0_8px_18px_rgba(14,165,233,0.2)] hover:bg-sky-700"><Plus className="mr-2 h-4 w-4" /> New collection</Button>
        </div>

        {showCreate && <Card className="ns-surface mb-6 border-sky-200 bg-sky-50/70 p-5 shadow-sm md:p-7"><div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Create a collection</h2><p className="text-sm text-slate-600">Start a focused set of resources with a clear point of view.</p></div><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="collection-name">Name</Label><Input id="collection-name" autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Modern research stack" maxLength={255} required /></div><div className="space-y-2"><Label>Visibility</Label><div className="flex gap-2"><Button type="button" variant={form.isPublic ? "default" : "outline"} onClick={() => setForm((current) => ({ ...current, isPublic: true }))} className={form.isPublic ? "bg-sky-600 text-white hover:bg-sky-700" : ""}><Globe2 className="mr-2 h-4 w-4" /> Public</Button><Button type="button" variant={!form.isPublic ? "default" : "outline"} onClick={() => setForm((current) => ({ ...current, isPublic: false }))} className={!form.isPublic ? "bg-slate-800 text-white hover:bg-slate-900" : ""}><LockKeyhole className="mr-2 h-4 w-4" /> Private</Button></div></div><div className="space-y-2 md:col-span-2"><Label htmlFor="collection-description">Description</Label><Textarea id="collection-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What will people learn from this stack?" maxLength={2000} rows={4} /></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end md:col-span-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={createCollection.isPending} className="bg-sky-600 text-white hover:bg-sky-700">{createCollection.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create collection"}</Button></div></form></Card>}

        {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /></div> : collections.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{collections.map((collection: any) => <Card key={collection.id} className="ns-hover-lift border-slate-200/90 bg-white/90 p-6 shadow-sm"><div className="flex items-start gap-4"><div className="ns-glow-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><FolderOpen className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="truncate text-lg font-semibold text-slate-950">{collection.name}</h2><Badge variant="outline" className="shrink-0">{collection.isPublic ? "Public" : "Private"}</Badge></div><p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">{collection.description || "A curated set of resources."}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">Updated {new Date(collection.updatedAt).toLocaleDateString()}</span><Button variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-50 hover:text-sky-900" onClick={() => setLocation(`/collection/${collection.id}`)}>Open <ArrowUpRight className="ml-1 h-4 w-4" /></Button></div></div></div></Card>)}</div> : <Card className="ns-surface p-10 text-center shadow-sm"><FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h2 className="text-lg font-semibold text-slate-950">No collections yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Create your first collection to turn individual resources into a navigable knowledge stack.</p><Button onClick={() => setShowCreate(true)} className="mt-5 bg-sky-600 text-white hover:bg-sky-700"><Plus className="mr-2 h-4 w-4" /> Create collection</Button></Card>}
      </div>
    </div>
  );
}
