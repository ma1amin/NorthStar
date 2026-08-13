import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Heart,
  Bookmark,
  FolderOpen,
  Loader2,
  AlertCircle,
  Pencil,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Profile() {
  const { user, isAuthenticated, startLogin } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", bio: "", avatar: "" });
  const [profileMessage, setProfileMessage] = useState("");
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationForm, setVerificationForm] = useState({ portfolioUrl: "", rationale: "" });

  const { data: contributions, isLoading: contributionsLoading } = trpc.resources.mySubmissions.useQuery(
    { limit: 50, offset: 0 },
    { enabled: !!user?.id }
  );
  const { data: collections, isLoading: collectionsLoading } = trpc.collections.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: !!user?.id }
  );
  const { data: bookmarks, isLoading: bookmarksLoading } = trpc.bookmarks.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );
  const { data: reputationSummary } = trpc.user.getReputationSummary.useQuery(undefined, { enabled: isAuthenticated });
  const { data: verification } = trpc.contributor.verification.useQuery(undefined, { enabled: isAuthenticated });
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setEditing(false);
      setProfileMessage("Profile updated.");
    },
    onError: (error) => setProfileMessage(error.message || "Could not update your profile."),
  });
  const createCollection = trpc.collections.create.useMutation({
    onSuccess: async () => {
      await utils.collections.list.invalidate();
      setProfileMessage("Collection created.");
    },
    onError: (error) => setProfileMessage(error.message || "Could not create collection."),
  });
  const applyForVerification = trpc.contributor.applyForVerification.useMutation({
    onSuccess: async () => {
      await utils.contributor.verification.invalidate();
      setShowVerificationForm(false);
      setProfileMessage("Verification application submitted for human review.");
    },
    onError: (error) => setProfileMessage(error.message || "Could not submit verification application."),
  });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name ?? "", bio: user.bio ?? "", avatar: user.avatar ?? "" });
    }
  }, [user]);

  const startEditing = () => {
    setProfileMessage("");
    setProfileForm({ name: user?.name ?? "", bio: user?.bio ?? "", avatar: user?.avatar ?? "" });
    setEditing(true);
  };

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    setProfileMessage("");
    updateProfile.mutate(profileForm);
  };

  const createFirstCollection = () => {
    const name = window.prompt("Name your collection");
    if (!name?.trim()) return;
    createCollection.mutate({ name: name.trim(), isPublic: true });
  };

  if (!isAuthenticated) {
    return (
      <div className="ns-noise min-h-screen bg-transparent py-12">
        <div className="container max-w-2xl">
          <Card className="ns-surface mx-auto p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h1 className="mb-2 text-2xl font-bold text-slate-950">{t("signInRequired")}</h1>
            <p className="mb-6 text-slate-600">{t("signInToViewProfile")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={startLogin} className="bg-sky-600 text-white hover:bg-sky-700">{t("signInToViewProfile")}</Button>
              <Button variant="outline" onClick={() => setLocation("/browse")} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">{t("browseResources")}</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-10 md:py-14">
      <div className="container max-w-5xl">
        <Card className="ns-surface-strong overflow-hidden border-slate-200/90 shadow-sm">
          <div className="ns-noise relative h-28 overflow-hidden bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-500"><div className="ns-grid-backdrop absolute inset-0 opacity-50" /></div>
          <div className="px-5 pb-7 md:px-8">
            <div className="-mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="ns-glow-ring flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-900 shadow-lg">
                  {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-9 w-9 text-white" />}
                </div>
                <div className="pb-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{user?.name || "NorthStar member"}</h1>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={startEditing} className="w-full border-slate-300 md:w-auto"><Pencil className="mr-2 h-4 w-4" /> {t("editProfile")}</Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">{user?.role === "admin" ? t("administrator") : t("member")}</Badge>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800"><Sparkles className="mr-1 h-3 w-3" /> {reputationSummary?.score ?? user?.reputation ?? 0} {t("reputation")}</Badge>
              {verification?.status === "approved" && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><ShieldCheck className="mr-1 h-3 w-3" /> {t("verifiedContributor")}</Badge>}
              <span className="text-sm text-slate-500">Building a more useful open web, one resource at a time.</span>
            </div>
            {user?.bio && <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{user.bio}</p>}
          </div>
        </Card>

        <Card className="ns-surface mt-5 border-violet-100 bg-[radial-gradient(circle_at_95%_5%,rgba(221,214,254,.7),transparent_32%),white] p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="max-w-2xl"><div className="flex items-center gap-2 text-violet-700"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-bold uppercase tracking-[.13em]">{t("verification")}</p></div><h2 className="mt-2 font-['Sora'] text-xl font-bold text-slate-950">{verification?.status === "approved" ? t("verifiedContributor") : t("fasterLane")}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t("verificationIntro")}</p></div>{verification?.status === "approved" ? <Badge className="w-fit bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{t("approved")}</Badge> : verification?.status === "pending" ? <Badge className="w-fit bg-amber-100 text-amber-800 hover:bg-amber-100">{t("pendingModeration")}</Badge> : <Button className="w-full bg-violet-600 text-white hover:bg-violet-700 md:w-auto" onClick={() => setShowVerificationForm((open) => !open)}>{t("applyForVerification")}</Button>}</div>
          <div className="mt-4 rounded-xl border border-violet-100 bg-white/80 p-4 text-sm text-slate-600"><p className="font-semibold text-slate-800">{t("contributorBenefits")}</p><p className="mt-1">{t("fasterLane")}—with sampled human review for every contributor status.</p></div>
          {showVerificationForm && <form className="mt-5 grid gap-4 rounded-2xl border border-violet-200 bg-white p-5" onSubmit={(event) => { event.preventDefault(); applyForVerification.mutate({ portfolioUrl: verificationForm.portfolioUrl.trim() || undefined, rationale: verificationForm.rationale.trim() }); }}><div className="space-y-2"><Label htmlFor="portfolio-url">{t("portfolioUrl")}</Label><Input id="portfolio-url" type="url" value={verificationForm.portfolioUrl} onChange={(event) => setVerificationForm((current) => ({ ...current, portfolioUrl: event.target.value }))} placeholder="https://…" /></div><div className="space-y-2"><Label htmlFor="verification-rationale">{t("verificationRationale")}</Label><Textarea id="verification-rationale" value={verificationForm.rationale} onChange={(event) => setVerificationForm((current) => ({ ...current, rationale: event.target.value }))} minLength={80} maxLength={3000} rows={5} required /></div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowVerificationForm(false)}>{t("cancel")}</Button><Button type="submit" disabled={applyForVerification.isPending || verificationForm.rationale.trim().length < 80} className="bg-violet-600 text-white hover:bg-violet-700">{applyForVerification.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("applyForVerification")}</Button></div></form>}
        </Card>

        <Card className="ns-surface mt-5 border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.9),#fff)] p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-700">{t("yourNorthStarPath")}</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{t("pathHeading")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t("pathDescription")}</p></div><Badge className="w-fit bg-sky-100 text-sky-800 hover:bg-sky-100">{[Boolean(user?.name && user.name !== "NorthStar member"), Boolean(user?.bio), Boolean(contributions?.length)].filter(Boolean).length}/3 {t("started")}</Badge></div><div className="mt-5 grid gap-3 md:grid-cols-3"><button type="button" onClick={startEditing} className="rounded-xl border border-sky-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><User className="h-5 w-5 text-sky-600" /><p className="mt-3 font-semibold text-slate-950">{user?.bio ? t("profileContextAdded") : t("addProfileContext")}</p><p className="mt-1 text-sm leading-5 text-slate-600">{user?.bio ? t("keepIdentityCurrent") : t("shareWhatExplore")}</p></button><button type="button" onClick={() => setLocation("/browse")} className="rounded-xl border border-violet-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><Bookmark className="h-5 w-5 text-violet-600" /><p className="mt-3 font-semibold text-slate-950">{t("buildPersonalMap")}</p><p className="mt-1 text-sm leading-5 text-slate-600">{t("saveResources")}</p></button><button type="button" onClick={() => setLocation("/submit")} className="rounded-xl border border-emerald-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Heart className="h-5 w-5 text-emerald-600" /><p className="mt-3 font-semibold text-slate-950">{contributions?.length ? t("keepContributing") : t("makeFirstContribution")}</p><p className="mt-1 text-sm leading-5 text-slate-600">{t("everySubmissionHuman")}</p></button></div>
        </Card>

        {editing && (
          <Card className="mt-5 border-sky-200 bg-sky-50/60 p-5 md:p-7">
            <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">{t("editYourProfile")}</h2><p className="text-sm text-slate-600">{t("identityContext")}</p></div>
            <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="profile-name">{t("displayName")}</Label><Input id="profile-name" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="profile-avatar">{t("avatarUrl")}</Label><Input id="profile-avatar" type="url" value={profileForm.avatar} onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))} placeholder="https://…" /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="profile-bio">{t("bio")}</Label><Textarea id="profile-bio" value={profileForm.bio} onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))} maxLength={1000} rows={4} placeholder={t("bioPlaceholder")} /></div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end md:col-span-2"><Button type="button" variant="outline" onClick={() => setEditing(false)}>{t("cancel")}</Button><Button type="submit" disabled={updateProfile.isPending} className="bg-sky-600 text-white hover:bg-sky-700">{updateProfile.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}</> : t("saveProfile")}</Button></div>
            </form>
          </Card>
        )}
        {profileMessage && <p className="mt-3 text-sm text-slate-600" role="status">{profileMessage}</p>}
        {reputationSummary?.events && reputationSummary.events.length > 0 && <Card className="mt-5 border-amber-200 bg-amber-50/60 p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">{t("reputationActivity")}</h2><p className="mt-1 text-sm text-slate-600">A transparent record of verified contribution signals.</p></div><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{reputationSummary.score} points</Badge></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{reputationSummary.events.slice(0, 6).map((event: any) => <div key={event.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-white/70 px-3 py-2 text-sm"><span className="text-slate-600">{event.reason}</span><span className={event.points >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{event.points > 0 ? "+" : ""}{event.points}</span></div>)}</div></Card>}

        <Tabs defaultValue="contributions" className="mt-8 w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 bg-white p-1 shadow-sm">
            <TabsTrigger value="contributions" className="gap-2 py-3"><Heart className="h-4 w-4" /> {t("contributions")}</TabsTrigger>
            <TabsTrigger value="collections" className="gap-2 py-3"><FolderOpen className="h-4 w-4" /> {t("collectionsTab")}</TabsTrigger>
            <TabsTrigger value="bookmarks" className="gap-2 py-3"><Bookmark className="h-4 w-4" /> {t("bookmarks")}</TabsTrigger>
          </TabsList>

          <TabsContent value="contributions" className="mt-5">
            {contributionsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : contributions && contributions.length > 0 ? <div className="grid gap-4">{contributions.map((submission: any) => <Card key={submission.id} className="border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="font-semibold text-slate-950">{submission.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{submission.description || submission.url}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline" className="capitalize">{submission.pricing.replace("_", " ")}</Badge><Badge className={submission.status === "approved" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : submission.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>{submission.status === "approved" ? t("approved") : submission.status === "rejected" ? t("needsRevision") : t("pendingModeration")}</Badge></div><p className="mt-3 text-xs text-slate-500">Submitted {new Date(submission.createdAt).toLocaleDateString()}</p></div><span className="shrink-0 text-xs font-medium text-slate-500">{submission.resourceId ? "Published" : "In review"}</span></div></Card>)}</div> : <Card className="p-8 text-center shadow-sm"><Heart className="mx-auto mb-4 h-12 w-12 text-slate-300" /><p className="text-slate-600">You haven’t contributed any resources yet.</p><Button className="mt-4 bg-sky-600 text-white hover:bg-sky-700" onClick={() => setLocation("/submit")}>{t("submitFirstResource")}</Button></Card>}
          </TabsContent>

          <TabsContent value="collections" className="mt-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-slate-950">{t("yourCollections")}</h2><p className="text-sm text-slate-500">{t("curateStacks")}</p></div><Button onClick={createFirstCollection} disabled={createCollection.isPending} className="bg-sky-600 text-white hover:bg-sky-700"><FolderOpen className="mr-2 h-4 w-4" /> {t("newCollection")}</Button></div>
            {collectionsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : collections && collections.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{collections.map((collection: any) => <Card key={collection.id} className="border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start gap-3"><FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-950">{collection.name}</h3><Badge variant="outline" className="shrink-0">{collection.isPublic ? t("public") : t("private")}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-slate-600">{collection.description || t("noDescription")}</p><Button variant="ghost" size="sm" className="mt-3 px-0 text-sky-700 hover:bg-transparent hover:text-sky-900" onClick={() => setLocation(`/collection/${collection.id}`)}>{t("openCollection")} <ArrowUpRight className="ml-1 h-4 w-4" /></Button></div></div></Card>)}</div> : <Card className="p-8 text-center shadow-sm"><FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" /><p className="text-slate-600">{t("noCollections")}</p><Button className="mt-4 bg-sky-600 text-white hover:bg-sky-700" onClick={createFirstCollection}>{t("createFirstCollection")}</Button></Card>}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-5">
            {bookmarksLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : bookmarks && bookmarks.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{bookmarks.map((resource: any) => <Card key={resource.id} className="border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-slate-950">{resource.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{resource.description || resource.url}</p><Badge variant="outline" className="mt-3 capitalize">{resource.pricing.replace("_", " ")}</Badge></div><Button variant="ghost" size="icon" aria-label={`Open ${resource.title}`} onClick={() => setLocation(`/resource/${resource.slug}`)}><ArrowUpRight className="h-4 w-4" /></Button></div></Card>)}</div> : <Card className="p-8 text-center shadow-sm"><Bookmark className="mx-auto mb-4 h-12 w-12 text-slate-300" /><p className="text-slate-600">You haven’t bookmarked any resources yet.</p><Button variant="outline" className="mt-4" onClick={() => setLocation("/browse")}>Explore resources</Button></Card>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
