import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowUpRight, Check, Copy, FolderOpen, Globe2, LockKeyhole, Loader2, Pencil, Trash2 } from "lucide-react";

export default function CollectionDetail() {
  const [, params] = useRoute("/collection/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const collectionId = Number(params?.id);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPublic: true });
  const { data: collection, isLoading: collectionLoading } = trpc.collections.getById.useQuery({ id: collectionId }, { enabled: Number.isInteger(collectionId) && collectionId > 0 });
  const { data: resources, isLoading: resourcesLoading } = trpc.collections.getResources.useQuery({ collectionId }, { enabled: Number.isInteger(collectionId) && collectionId > 0 });
  const updateCollection = trpc.collections.update.useMutation({ onSuccess: async () => { await Promise.all([utils.collections.getById.invalidate({ id: collectionId }), utils.collections.list.invalidate()]); setEditing(false); } });
  const removeResource = trpc.collections.removeResource.useMutation({ onSuccess: () => utils.collections.getResources.invalidate({ collectionId }) });
  const deleteCollection = trpc.collections.delete.useMutation({ onSuccess: () => { utils.collections.list.invalidate(); setLocation("/collections"); } });

  const isOwner = !!user?.id && collection?.ownerId === user.id;
  const startEditing = () => {
    if (!collection) return;
    setForm({ name: collection.name, description: collection.description ?? "", isPublic: collection.isPublic });
    setEditing(true);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    updateCollection.mutate({ collectionId, name: form.name.trim(), description: form.description.trim() || undefined, isPublic: form.isPublic });
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const remove = (resourceId: number) => {
    if (window.confirm("Remove this resource from the collection?")) removeResource.mutate({ collectionId, resourceId });
  };
  const removeCollection = () => {
    if (window.confirm("Delete this collection? This cannot be undone.")) deleteCollection.mutate({ collectionId });
  };

  if (collectionLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /></div>;
  if (!collection) return <div className="container py-16"><Card className="p-10 text-center"><h1 className="text-2xl font-semibold text-slate-950">Collection not found</h1><p className="mt-2 text-slate-600">This collection may be private or no longer available.</p><Button className="mt-5" onClick={() => setLocation("/collections")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to collections</Button></Card></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-12">
      <div className="container max-w-5xl">
        <Button variant="ghost" className="mb-5 px-0 text-slate-600 hover:bg-transparent hover:text-sky-700" onClick={() => setLocation("/collections")}><ArrowLeft className="mr-2 h-4 w-4" /> All collections</Button>
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm"><div className="h-28 bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-700" /><div className="px-5 pb-7 md:px-8"><div className="-mt-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div className="flex items-end gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-sky-100 text-sky-700 shadow-lg"><FolderOpen className="h-7 w-7" /></div><div className="pb-1"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge className={collection.isPublic ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-slate-200 text-slate-700 hover:bg-slate-200"}>{collection.isPublic ? <><Globe2 className="mr-1 h-3 w-3" /> Public</> : <><LockKeyhole className="mr-1 h-3 w-3" /> Private</>}</Badge></div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">{collection.name}</h1></div></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={share} className="border-slate-300">{copied ? <><Check className="mr-2 h-4 w-4 text-emerald-600" /> Link copied</> : <><Copy className="mr-2 h-4 w-4" /> Copy share link</>}</Button>{isOwner && <Button variant="outline" onClick={startEditing}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>}</div></div><p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">{collection.description || "A curated set of resources."}</p><p className="mt-3 text-xs text-slate-500">{resources?.length ?? 0} resources · Updated {new Date(collection.updatedAt).toLocaleDateString()}</p></div></Card>

        {editing && isOwner && <Card className="mt-5 border-sky-200 bg-sky-50/70 p-5 md:p-7"><h2 className="text-lg font-semibold text-slate-950">Edit collection</h2><form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-collection-name">Name</Label><Input id="edit-collection-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required maxLength={255} /></div><div className="space-y-2"><Label>Visibility</Label><div className="flex gap-2"><Button type="button" variant={form.isPublic ? "default" : "outline"} onClick={() => setForm((current) => ({ ...current, isPublic: true }))} className={form.isPublic ? "bg-sky-600 text-white hover:bg-sky-700" : ""}><Globe2 className="mr-2 h-4 w-4" /> Public</Button><Button type="button" variant={!form.isPublic ? "default" : "outline"} onClick={() => setForm((current) => ({ ...current, isPublic: false }))} className={!form.isPublic ? "bg-slate-800 text-white hover:bg-slate-900" : ""}><LockKeyhole className="mr-2 h-4 w-4" /> Private</Button></div></div><div className="space-y-2 md:col-span-2"><Label htmlFor="edit-collection-description">Description</Label><Textarea id="edit-collection-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={2000} rows={4} /></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between md:col-span-2"><Button type="button" variant="ghost" className="justify-start px-0 text-red-600 hover:bg-transparent hover:text-red-700" onClick={removeCollection} disabled={deleteCollection.isPending}><Trash2 className="mr-2 h-4 w-4" /> Delete collection</Button><div className="flex gap-3"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" disabled={updateCollection.isPending} className="bg-sky-600 text-white hover:bg-sky-700">{updateCollection.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}</Button></div></div></form></Card>}

        <div className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Knowledge stack</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Resources in this collection</h2></div></div>{resourcesLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /></div> : resources && resources.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{resources.map((resource: any) => <Card key={resource.id} className="border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-slate-950">{resource.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{resource.description || resource.url}</p><Badge variant="outline" className="mt-3 capitalize">{resource.pricing.replace("_", " ")}</Badge></div><Button variant="ghost" size="icon" aria-label={`Open ${resource.title}`} onClick={() => setLocation(`/resource/${resource.slug}`)}><ArrowUpRight className="h-4 w-4" /></Button></div>{isOwner && <Button variant="ghost" size="sm" className="mt-4 px-0 text-xs text-red-600 hover:bg-transparent hover:text-red-700" onClick={() => remove(resource.id)} disabled={removeResource.isPending}>Remove from collection</Button>}</Card>)}</div> : <Card className="p-10 text-center shadow-sm"><FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h3 className="font-semibold text-slate-950">This collection is empty</h3><p className="mt-2 text-sm text-slate-600">Open a resource and add it to this stack to make the collection useful.</p><Button className="mt-5 bg-sky-600 text-white hover:bg-sky-700" onClick={() => setLocation("/browse")}>Explore resources</Button></Card>}</div>
      </div>
    </div>
  );
}
