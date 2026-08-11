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
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", bio: "", avatar: "" });
  const [profileMessage, setProfileMessage] = useState("");

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
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container max-w-2xl">
          <Card className="p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h1 className="mb-2 text-2xl font-bold text-slate-950">Sign In Required</h1>
            <p className="mb-6 text-slate-600">You need to be signed in to view your profile.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => { window.location.href = getLoginUrl(); }} className="bg-sky-600 text-white hover:bg-sky-700">Sign in to view profile</Button>
              <Button variant="outline" onClick={() => setLocation("/browse")} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">Browse resources</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-12">
      <div className="container max-w-5xl">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-500" />
          <div className="px-5 pb-7 md:px-8">
            <div className="-mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-900 shadow-lg">
                  {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-9 w-9 text-white" />}
                </div>
                <div className="pb-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{user?.name || "NorthStar member"}</h1>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={startEditing} className="w-full border-slate-300 md:w-auto"><Pencil className="mr-2 h-4 w-4" /> Edit profile</Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">{user?.role === "admin" ? "Administrator" : "Member"}</Badge>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800"><Sparkles className="mr-1 h-3 w-3" /> {reputationSummary?.score ?? user?.reputation ?? 0} reputation</Badge>
              <span className="text-sm text-slate-500">Building a more useful open web, one resource at a time.</span>
            </div>
            {user?.bio && <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{user.bio}</p>}
          </div>
        </Card>

        {editing && (
          <Card className="mt-5 border-sky-200 bg-sky-50/60 p-5 md:p-7">
            <div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">Edit your profile</h2><p className="text-sm text-slate-600">Keep your identity and context current for the community.</p></div>
            <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="profile-name">Display name</Label><Input id="profile-name" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} maxLength={255} /></div>
              <div className="space-y-2"><Label htmlFor="profile-avatar">Avatar URL</Label><Input id="profile-avatar" type="url" value={profileForm.avatar} onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))} placeholder="https://…" /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="profile-bio">Bio</Label><Textarea id="profile-bio" value={profileForm.bio} onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))} maxLength={1000} rows={4} placeholder="What do you explore or build?" /></div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end md:col-span-2"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" disabled={updateProfile.isPending} className="bg-sky-600 text-white hover:bg-sky-700">{updateProfile.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save profile"}</Button></div>
            </form>
          </Card>
        )}
        {profileMessage && <p className="mt-3 text-sm text-slate-600" role="status">{profileMessage}</p>}
        {reputationSummary?.events && reputationSummary.events.length > 0 && <Card className="mt-5 border-amber-200 bg-amber-50/60 p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Reputation activity</h2><p className="mt-1 text-sm text-slate-600">A transparent record of verified contribution signals.</p></div><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{reputationSummary.score} points</Badge></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{reputationSummary.events.slice(0, 6).map((event: any) => <div key={event.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-white/70 px-3 py-2 text-sm"><span className="text-slate-600">{event.reason}</span><span className={event.points >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{event.points > 0 ? "+" : ""}{event.points}</span></div>)}</div></Card>}

        <Tabs defaultValue="contributions" className="mt-8 w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 bg-white p-1 shadow-sm">
            <TabsTrigger value="contributions" className="gap-2 py-3"><Heart className="h-4 w-4" /> Contributions</TabsTrigger>
            <TabsTrigger value="collections" className="gap-2 py-3"><FolderOpen className="h-4 w-4" /> Collections</TabsTrigger>
            <TabsTrigger value="bookmarks" className="gap-2 py-3"><Bookmark className="h-4 w-4" /> Bookmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="contributions" className="mt-5">
            {contributionsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : contributions && contributions.length > 0 ? <div className="grid gap-4">{contributions.map((submission: any) => <Card key={submission.id} className="border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="font-semibold text-slate-950">{submission.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{submission.description || submission.url}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline" className="capitalize">{submission.pricing.replace("_", " ")}</Badge><Badge className={submission.status === "approved" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : submission.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>{submission.status === "approved" ? "Approved" : submission.status === "rejected" ? "Needs revision" : "Pending moderation"}</Badge></div><p className="mt-3 text-xs text-slate-500">Submitted {new Date(submission.createdAt).toLocaleDateString()}</p></div><span className="shrink-0 text-xs font-medium text-slate-500">{submission.resourceId ? "Published" : "In review"}</span></div></Card>)}</div> : <Card className="p-8 text-center shadow-sm"><Heart className="mx-auto mb-4 h-12 w-12 text-slate-300" /><p className="text-slate-600">You haven’t contributed any resources yet.</p><Button className="mt-4 bg-sky-600 text-white hover:bg-sky-700" onClick={() => setLocation("/submit")}>Submit your first resource</Button></Card>}
          </TabsContent>

          <TabsContent value="collections" className="mt-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-slate-950">Your collections</h2><p className="text-sm text-slate-500">Curate reusable stacks of resources for yourself or the community.</p></div><Button onClick={createFirstCollection} disabled={createCollection.isPending} className="bg-sky-600 text-white hover:bg-sky-700"><FolderOpen className="mr-2 h-4 w-4" /> New collection</Button></div>
            {collectionsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : collections && collections.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{collections.map((collection: any) => <Card key={collection.id} className="border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start gap-3"><FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-950">{collection.name}</h3><Badge variant="outline" className="shrink-0">{collection.isPublic ? "Public" : "Private"}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-slate-600">{collection.description || "No description yet."}</p><Button variant="ghost" size="sm" className="mt-3 px-0 text-sky-700 hover:bg-transparent hover:text-sky-900" onClick={() => setLocation(`/collection/${collection.id}`)}>Open collection <ArrowUpRight className="ml-1 h-4 w-4" /></Button></div></div></Card>)}</div> : <Card className="p-8 text-center shadow-sm"><FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" /><p className="text-slate-600">You haven’t created any collections yet.</p><Button className="mt-4 bg-sky-600 text-white hover:bg-sky-700" onClick={createFirstCollection}>Create your first collection</Button></Card>}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-5">
            {bookmarksLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : bookmarks && bookmarks.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{bookmarks.map((resource: any) => <Card key={resource.id} className="border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-slate-950">{resource.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{resource.description || resource.url}</p><Badge variant="outline" className="mt-3 capitalize">{resource.pricing.replace("_", " ")}</Badge></div><Button variant="ghost" size="icon" aria-label={`Open ${resource.title}`} onClick={() => setLocation(`/resource/${resource.slug}`)}><ArrowUpRight className="h-4 w-4" /></Button></div></Card>)}</div> : <Card className="p-8 text-center shadow-sm"><Bookmark className="mx-auto mb-4 h-12 w-12 text-slate-300" /><p className="text-slate-600">You haven’t bookmarked any resources yet.</p><Button variant="outline" className="mt-4" onClick={() => setLocation("/browse")}>Explore resources</Button></Card>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
