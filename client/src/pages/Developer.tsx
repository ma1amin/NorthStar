import { useEffect, useState } from "react";
import { BookOpen, Check, Code2, Copy, Github, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { applyClientSeo } from "@/lib/seo";

const scopeOptions = ["resources:read", "search:read", "categories:read", "collections:read"] as const;

export default function Developer() {
  const { t } = useLanguage();
  const { isAuthenticated, startLogin } = useAuth();
  useEffect(() => { applyClientSeo({ title: `${t("developer")} — NorthStar`, description: t("developerIntro"), canonicalPath: "/developer" }); }, [t]);
  return <div className="ns-noise min-h-screen py-10 md:py-14"><div className="container max-w-5xl"><header className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-xl md:p-10"><Code2 className="h-10 w-10 text-sky-300" /><p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">NorthStar</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">{t("developer")}</h1><p className="mt-3 max-w-2xl text-slate-300">{t("developerIntro")}</p></header><div className="mt-8 grid gap-4 md:grid-cols-2"><Card className="ns-hover-lift border-slate-200/90 bg-white/90 p-6 shadow-sm"><BookOpen className="h-6 w-6 text-sky-600" /><h2 className="mt-5 text-xl font-semibold text-slate-950">{t("apiBoundary")}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{t("apiBoundaryText")}</p><Button variant="outline" className="mt-5" onClick={() => window.open("/v1/openapi.json", "_blank", "noopener,noreferrer")}>{t("readApiDocs")}</Button></Card><Card className="ns-hover-lift border-slate-200/90 bg-white/90 p-6 shadow-sm"><ShieldCheck className="h-6 w-6 text-violet-600" /><h2 className="mt-5 text-xl font-semibold text-slate-950">{t("openSourceCollaboration")}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{t("openSourceText")}</p><Button variant="outline" className="mt-5" onClick={() => window.open("https://github.com/ma1amin/NorthStar", "_blank", "noopener,noreferrer")}><Github className="mr-2 h-4 w-4" />GitHub</Button></Card></div><section className="mt-8"><ApiKeyPortal isAuthenticated={isAuthenticated} startLogin={startLogin} /></section></div></div>;
}

function ApiKeyPortal({ isAuthenticated, startLogin }: { isAuthenticated: boolean; startLogin: () => void }) {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["resources:read", "search:read"]);
  const [dailyQuota, setDailyQuota] = useState(1000);
  const [newKey, setNewKey] = useState<string | null>(null);
  const { data: keys = [], isLoading } = trpc.apiKeys.list.useQuery(undefined, { enabled: isAuthenticated });
  const createKey = trpc.apiKeys.create.useMutation({ onSuccess: async (result) => { setNewKey(result.key); setName(""); await utils.apiKeys.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const revokeKey = trpc.apiKeys.revoke.useMutation({ onSuccess: async () => utils.apiKeys.list.invalidate(), onError: (error) => toast.error(error.message) });
  const toggleScope = (scope: string, checked: boolean) => setScopes((current) => checked ? Array.from(new Set([...current, scope])) : current.filter((item) => item !== scope));
  const copyKey = async () => { if (!newKey) return; await navigator.clipboard.writeText(newKey); toast.success(t("copiedKey")); };
  if (!isAuthenticated) return <Card className="ns-surface p-7 shadow-sm"><KeyRound className="h-7 w-7 text-sky-600" /><h2 className="mt-4 text-2xl font-semibold text-slate-950">{t("apiKeys")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t("signInToManageApi")}</p><Button className="mt-5 bg-sky-600 text-white hover:bg-sky-700" onClick={startLogin}>{t("signIn")}</Button></Card>;
  return <Card className="ns-surface p-6 shadow-sm md:p-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><KeyRound className="h-6 w-6 text-sky-600" /><h2 className="text-2xl font-semibold text-slate-950">{t("apiKeys")}</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t("apiKeyIntro")}</p></div></div>{newKey && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">{t("apiKeySecretWarning")}</p><code className="mt-3 block overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-sky-200">{newKey}</code><div className="mt-3 flex gap-2"><Button size="sm" onClick={copyKey} className="bg-slate-900 text-white hover:bg-slate-800"><Copy className="mr-2 h-4 w-4" />{t("copyKey")}</Button><Button size="sm" variant="outline" onClick={() => setNewKey(null)}>{t("cancel")}</Button></div></div>}<form className="mt-7 rounded-2xl border border-slate-200 bg-white/70 p-5" onSubmit={(event) => { event.preventDefault(); if (name.trim() && scopes.length) createKey.mutate({ name: name.trim(), scopes: scopes as any, dailyQuota }); }}><div className="grid gap-5 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="api-key-name">{t("apiKeyName")}</Label><Input id="api-key-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("apiKeyNamePlaceholder")} maxLength={100} required /></div><div className="space-y-2"><Label htmlFor="api-key-quota">{t("dailyQuota")}</Label><Input id="api-key-quota" type="number" min={100} max={10000} value={dailyQuota} onChange={(event) => setDailyQuota(Math.min(10000, Math.max(100, Number(event.target.value) || 100)))} /></div><div className="space-y-3 md:col-span-2"><Label>{t("apiScopes")}</Label><div className="grid gap-2 sm:grid-cols-2">{scopeOptions.map((scope) => <label key={scope} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><Checkbox checked={scopes.includes(scope)} onCheckedChange={(checked) => toggleScope(scope, checked === true)} /><span>{scope}</span></label>)}</div></div><div className="md:col-span-2"><Button type="submit" disabled={createKey.isPending || !scopes.length} className="bg-sky-600 text-white hover:bg-sky-700">{createKey.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("creating")}</> : <><KeyRound className="mr-2 h-4 w-4" />{t("createApiKey")}</>}</Button></div></div></form><div className="mt-7"><h3 className="text-lg font-semibold text-slate-950">{t("apiUsageToday")}</h3>{isLoading ? <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-600" /></div> : keys.length ? <div className="mt-4 grid gap-3">{keys.map((key) => <ApiKeyRow key={key.id} apiKey={key} onRevoke={() => revokeKey.mutate({ apiKeyId: key.id })} isRevoking={revokeKey.isPending} />)}</div> : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{t("noApiKeys")}</p>}</div></Card>;
}

function ApiKeyRow({ apiKey, onRevoke, isRevoking }: { apiKey: any; onRevoke: () => void; isRevoking: boolean }) {
  const { t } = useLanguage();
  const usage = trpc.apiKeys.usage.useQuery({ apiKeyId: apiKey.id }, { enabled: apiKey.status === "active" });
  return <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{apiKey.name}</p><Badge className={apiKey.status === "active" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-100"}>{apiKey.status === "active" ? t("active") : t("revoked")}</Badge></div><p className="mt-1 font-mono text-xs text-slate-500">{apiKey.keyPrefix}••••••••</p><p className="mt-2 text-xs text-slate-500">{apiKey.scopes.join(", ")} · {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : t("noExpiry")} · {usage.data ? `${usage.data.remaining} ${t("remainingRequests")}` : `${apiKey.dailyQuota} ${t("dailyQuota")}`}</p></div>{apiKey.status === "active" && <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={onRevoke} disabled={isRevoking}><Trash2 className="mr-2 h-4 w-4" />{t("revokeKey")}</Button>}</div>;
}
