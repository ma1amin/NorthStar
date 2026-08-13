import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowUpRight, FolderOpen, Globe2, Layers3, Loader2, LockKeyhole, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Collections() {
  const { t } = useLanguage();
  const { isAuthenticated, startLogin } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPublic: true });
  const { data: personalCollections = [], isLoading: personalLoading } = trpc.collections.list.useQuery({ limit: 100, offset: 0 }, { enabled: isAuthenticated });
  const { data: publicCollections = [], isLoading: publicLoading } = trpc.collections.discover.useQuery({ limit: 50, offset: 0 });
  const personalCollectionIds = useMemo(() => new Set(personalCollections.map((collection: any) => collection.id)), [personalCollections]);
  const discoverableCollections = useMemo(() => publicCollections.filter((collection: any) => !personalCollectionIds.has(collection.id)), [personalCollectionIds, publicCollections]);
  const createCollection = trpc.collections.create.useMutation({
    onSuccess: async (collection) => {
      await Promise.all([utils.collections.list.invalidate(), utils.collections.discover.invalidate()]);
      setForm({ name: "", description: "", isPublic: true });
      setShowCreate(false);
      setLocation(`/collection/${collection.id}`);
    },
    onError: (error) => toast.error(error.message || t("createCollection")),
  });

  const openCreate = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setShowCreate((value) => !value);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    createCollection.mutate({ name: form.name.trim(), description: form.description.trim() || undefined, isPublic: form.isPublic });
  };

  return (
    <div className="ns-noise min-h-screen bg-transparent py-10 md:py-14">
      <div className="container max-w-6xl">
        <div className="animate-fade-in-up mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{t("curatedKnowledge")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{t("collections")}</h1><p className="mt-3 max-w-2xl text-slate-600">{t("collectionDiscoveryIntro")}</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold"><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm ring-1 ring-slate-200"><Layers3 className="h-3.5 w-3.5 text-sky-600" /> {publicLoading ? t("loadingStacks") : `${publicCollections.length} ${t("shareable")}`}</span>{isAuthenticated && <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-violet-700 ring-1 ring-violet-100"><FolderOpen className="h-3.5 w-3.5" /> {personalLoading ? t("loadingStacks") : `${personalCollections.length} ${t("myCollections")}`}</span>}</div></div>
          <Button onClick={openCreate} className="rounded-xl bg-sky-600 text-white shadow-[0_8px_18px_rgba(14,165,233,0.2)] hover:bg-sky-700"><Plus className="mr-2 h-4 w-4" />{t("newCollection")}</Button>
        </div>

        {!isAuthenticated && <Card className="mb-6 border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-950"><p>{t("signInToCreateCollection")}</p></Card>}
        {showCreate && <Card className="ns-surface mb-6 border-sky-200 bg-sky-50/70 p-5 shadow-sm md:p-7"><div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">{t("createCollection")}</h2><p className="text-sm text-slate-600">{t("collectionDiscoveryIntro")}</p></div><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="collection-name">{t("collectionName")}</Label><Input id="collection-name" autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Modern research stack" maxLength={255} required /></div><div className="space-y-2"><Label>{t("visibility")}</Label><div className="flex gap-2"><Button type="button" variant={form.isPublic ? "default" : "outline"} onClick={() => setForm((current) => ({ ...current, isPublic: true }))} className={form.isPublic ? "bg-sky-600 text-white hover:bg-sky-700" : ""}><Globe2 className="mr-2 h-4 w-4" />{t("public")}</Button><Button type="button" variant={!form.isPublic ? "default" : "outline"} onClick={() => setForm((current) => ({ ...current, isPublic: false }))} className={!form.isPublic ? "bg-slate-800 text-white hover:bg-slate-900" : ""}><LockKeyhole className="mr-2 h-4 w-4" />{t("private")}</Button></div></div><div className="space-y-2 md:col-span-2"><Label htmlFor="collection-description">{t("collectionDescription")}</Label><Textarea id="collection-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder={t("collectionDescriptionPlaceholder")} maxLength={2000} rows={4} /></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end md:col-span-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>{t("cancel")}</Button><Button type="submit" disabled={createCollection.isPending} className="bg-sky-600 text-white hover:bg-sky-700">{createCollection.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("creating")}</> : t("createCollection")}</Button></div></form></Card>}

        <CollectionSection title={t("collectionDiscovery")} subtitle={t("collectionDiscoveryIntro")} icon={UsersRound} collections={discoverableCollections} loading={publicLoading} empty={t("noPublicCollections")} onOpen={(id) => setLocation(`/collection/${id}`)} showOwner />
        {isAuthenticated && <CollectionSection title={t("myCollections")} subtitle={t("organizeGuidance")} icon={FolderOpen} collections={personalCollections} loading={personalLoading} empty={t("noCollectionsYet")} onOpen={(id) => setLocation(`/collection/${id}`)} onCreate={openCreate} />}
      </div>
    </div>
  );
}

function CollectionSection({ title, subtitle, icon: Icon, collections, loading, empty, onOpen, onCreate, showOwner = false }: { title: string; subtitle: string; icon: typeof FolderOpen; collections: any[]; loading: boolean; empty: string; onOpen: (id: number) => void; onCreate?: () => void; showOwner?: boolean }) {
  const { t } = useLanguage();
  return <section className="mb-10"><div className="mb-5 flex items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-sky-700"><Icon className="h-4 w-4" />{title}</div><p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p></div></div>{loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /></div> : collections.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{collections.map((collection: any) => <Card key={collection.id} className="ns-hover-lift flex min-h-[230px] flex-col border-slate-200/90 bg-white/90 p-6 shadow-sm"><div className="flex items-start gap-4"><div className="ns-glow-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><FolderOpen className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="truncate text-lg font-semibold text-slate-950">{collection.name}</h2><Badge variant="outline" className="shrink-0"><Globe2 className="mr-1 h-3 w-3" />{t("public")}</Badge></div><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{collection.description || t("curatedResourceSet")}</p></div></div><div className="mt-auto pt-5"><div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500"><span>{collection.resourceCount ?? 0} {t("resourceCount")}</span>{showOwner && <span>{t("collectionOwner")} {collection.ownerName || t("unknown")}</span>}<span>{t("updated")} {new Date(collection.updatedAt).toLocaleDateString()}</span></div><Button variant="ghost" size="sm" className="mt-3 px-0 text-sky-700 hover:bg-transparent hover:text-sky-900" onClick={() => onOpen(collection.id)}>{t("open")}<ArrowUpRight className="ml-1 h-4 w-4" /></Button></div></Card>)}</div> : <Card className="ns-surface p-10 text-center shadow-sm"><FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h2 className="text-lg font-semibold text-slate-950">{empty}</h2>{onCreate && <Button onClick={onCreate} className="mt-5 bg-sky-600 text-white hover:bg-sky-700"><Plus className="mr-2 h-4 w-4" />{t("createCollection")}</Button>}</Card>}</section>;
}
