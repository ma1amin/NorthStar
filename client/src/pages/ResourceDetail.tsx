import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ExternalLink,
  GitBranch,
  Link as LinkIcon,
  Loader2,
  Network,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { applyClientSeo } from "@/lib/seo";
import { ReportResourceDialog } from "@/components/ReportResourceDialog";
import { SuggestResourceEditDialog } from "@/components/SuggestResourceEditDialog";

const RELATIONSHIP_TABS = [
  { value: "alternatives", label: "Alternatives", type: "alternative_to" as const },
  { value: "integrations", label: "Integrations", type: "integrates_with" as const },
  { value: "competitors", label: "Competitors", type: "competitor_of" as const },
  { value: "ecosystem", label: "Ecosystem", type: "part_of" as const },
  { value: "similar", label: "Similar", type: "similar_to" as const },
];

const RELATIONSHIP_LABELS: Record<string, string> = {
  alternative_to: "Alternative To",
  similar_to: "Similar To",
  integrates_with: "Integrates With",
  built_by: "Built By",
  maintained_by: "Maintained By",
  funded_by: "Funded By",
  used_by: "Used By",
  depends_on: "Depends On",
  part_of: "Part Of",
  competitor_of: "Competitor Of",
};

function RelationshipCard({ relationship }: { relationship: any }) {
  const target = relationship.target;
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const { data: vote } = trpc.votes.getRelationshipVote.useQuery(
    { relationshipId: relationship.id },
    { enabled: Boolean(relationship.id && isAuthenticated) }
  );
  const voteMutation = trpc.votes.voteRelationship.useMutation({
    onSuccess: async () => {
      toast.success("Relationship vote saved");
      await utils.votes.getRelationshipVote.invalidate({ relationshipId: relationship.id });
    },
    onError: () => toast.error("We couldn’t save your relationship vote. Please try again."),
  });

  useEffect(() => {
    setUserVote((vote?.type as "upvote" | "downvote" | undefined) ?? null);
  }, [vote?.type]);

  if (!target) return null;

  const handleVote = (type: "upvote" | "downvote") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    voteMutation.mutate({ relationshipId: relationship.id, type });
  };

  return (
    <Card className="group border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-600">
            {RELATIONSHIP_LABELS[relationship.type] ?? relationship.type}
          </p>
          <Link href={`/resource/${target.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <h3 className="mt-2 text-lg font-semibold text-slate-950 group-hover:text-sky-700">{target.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{target.description || "Explore this connected resource."}</p>
          </Link>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {Math.round(Number(relationship.strength) * 100)}% strength
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="capitalize">{target.pricing?.replace("_", " ")}</span>
        {relationship.verified && <span className="text-emerald-600">Verified relationship</span>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">Is this connection useful?</span>
        <div className="flex gap-1.5">
          <Button type="button" size="sm" variant={userVote === "upvote" ? "default" : "outline"} aria-label={`Upvote relationship to ${target.title}`} onClick={() => handleVote("upvote")} disabled={voteMutation.isPending}><ThumbsUp className="h-3.5 w-3.5" /></Button>
          <Button type="button" size="sm" variant={userVote === "downvote" ? "default" : "outline"} aria-label={`Downvote relationship to ${target.title}`} onClick={() => handleVote("downvote")} disabled={voteMutation.isPending}><ThumbsDown className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </Card>
  );
}

export default function ResourceDetail() {
  const [, params] = useRoute("/resource/:slug");
  const slug = params?.slug ?? "";
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");

  const { data: resource, isLoading: resourceLoading } = trpc.resources.getBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug), retry: false }
  );
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const category = useMemo(
    () => categories.find((item) => item.id === resource?.categoryId),
    [categories, resource?.categoryId]
  );

  const { data: alternatives = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "alternative_to" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: alternativesIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "alternative_to" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: integrations = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "integrates_with" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: integrationsIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "integrates_with" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: competitors = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "competitor_of" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: competitorsIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "competitor_of" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: partOf = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "part_of" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: partOfIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "part_of" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: dependsOn = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "depends_on" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: dependsOnIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "depends_on" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: maintainedBy = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "maintained_by" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: maintainedByIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "maintained_by" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: fundedBy = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "funded_by" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: fundedByIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "funded_by" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: usedBy = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "used_by" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: usedByIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "used_by" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: similar = [] } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id ?? 0, type: "similar_to" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: similarIncoming = [] } = trpc.relationships.getByTarget.useQuery(
    { targetId: resource?.id ?? 0, type: "similar_to" },
    { enabled: Boolean(resource?.id) }
  );
  const { data: vote } = trpc.votes.getResourceVote.useQuery(
    { resourceId: resource?.id ?? 0 },
    { enabled: Boolean(resource?.id && isAuthenticated) }
  );
  const { data: bookmarked } = trpc.bookmarks.isBookmarked.useQuery(
    { resourceId: resource?.id ?? 0 },
    { enabled: Boolean(resource?.id && isAuthenticated) }
  );
  const { data: collections = [] } = trpc.collections.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    setUserVote((vote?.type as "upvote" | "downvote" | undefined) ?? null);
  }, [vote?.type]);

  useEffect(() => {
    setIsBookmarked(Boolean(bookmarked));
  }, [bookmarked]);

  useEffect(() => {
    if (!resource) return;
    applyClientSeo({
      title: `${resource.title} — NorthStar`,
      description: resource.description || `Explore ${resource.title} in the NorthStar resource intelligence graph.`,
      canonicalPath: `/resource/${resource.slug}`,
      robots: resource.status === "approved" ? "index,follow" : "noindex,follow",
    });
  }, [resource]);

  const voteMutation = trpc.votes.voteResource.useMutation({
    onSuccess: async () => {
      toast.success("Your vote was saved");
      await utils.votes.getResourceVote.invalidate({ resourceId: resource?.id ?? 0 });
      await utils.resources.getBySlug.invalidate({ slug });
    },
    onError: () => toast.error("We couldn’t save your vote. Please try again."),
  });
  const bookmarkMutation = trpc.bookmarks.toggle.useMutation({
    onSuccess: async (result) => {
      setIsBookmarked(result.bookmarked);
      toast.success(result.bookmarked ? "Resource saved" : "Resource removed from saved items");
      await utils.bookmarks.isBookmarked.invalidate({ resourceId: resource?.id ?? 0 });
    },
    onError: () => {
      setIsBookmarked(Boolean(bookmarked));
      toast.error("We couldn’t update your saved items. Please try again.");
    },
  });
  const addToCollectionMutation = trpc.collections.addResource.useMutation({
    onSuccess: async () => {
      toast.success("Resource added to collection");
      await utils.collections.getResources.invalidate({ collectionId: Number(selectedCollectionId) });
    },
    onError: (error) => toast.error(error.message || "Could not add this resource to the collection."),
  });

  const handleProtectedAction = () => {
    window.location.href = getLoginUrl();
  };

  const handleVote = (type: "upvote" | "downvote") => {
    if (!isAuthenticated) {
      handleProtectedAction();
      return;
    }
    if (!resource) return;
    voteMutation.mutate({ resourceId: resource.id, type });
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      handleProtectedAction();
      return;
    }
    if (!resource) return;
    bookmarkMutation.mutate({ resourceId: resource.id });
  };

  const handleAddToCollection = () => {
    if (!isAuthenticated) {
      handleProtectedAction();
      return;
    }
    if (!resource || !selectedCollectionId) {
      toast.info("Choose a collection first");
      return;
    }
    addToCollectionMutation.mutate({ collectionId: Number(selectedCollectionId), resourceId: resource.id });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      toast.error("We couldn’t copy the link");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.info("Native sharing is unavailable; the link was copied instead.");
      await handleShare();
      return;
    }
    try {
      await navigator.share({
        title: resource?.title,
        text: resource?.description ?? "Explore this resource on NorthStar.",
        url: window.location.href,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("We couldn’t open the share dialog");
    }
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener,noreferrer");
  };

  if (resourceLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-48 w-full" />
        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-950">Resource not found</h1>
        <p className="mt-3 text-slate-600">This resource may have been removed or is still awaiting approval.</p>
        <Link href="/browse">
          <Button className="mt-6 bg-sky-600 text-white hover:bg-sky-700">Browse resources</Button>
        </Link>
      </div>
    );
  }

  const mergeRelationships = (outgoing: any[], incoming: any[]) => [
    ...outgoing,
    ...incoming.map((relationship) => ({ ...relationship, target: relationship.source ?? null })),
  ];
  const tabData = {
    alternatives: mergeRelationships(alternatives, alternativesIncoming),
    integrations: mergeRelationships(integrations, integrationsIncoming),
    competitors: mergeRelationships(competitors, competitorsIncoming),
    ecosystem: mergeRelationships(
      [...partOf, ...dependsOn, ...maintainedBy, ...fundedBy, ...usedBy],
      [...partOfIncoming, ...dependsOnIncoming, ...maintainedByIncoming, ...fundedByIncoming, ...usedByIncoming]
    ),
    similar: mergeRelationships(similar, similarIncoming),
  };
  const connectionCount = Object.values(tabData).reduce((count, relationships) => count + relationships.length, 0);
  const activeRelationshipTypeCount = Object.values(tabData).filter((relationships) => relationships.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container py-6 md:py-10">
          <Link href="/browse" className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
            <ArrowLeft className="h-4 w-4" /> Back to browse
          </Link>
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-xl font-bold text-white shadow-lg">
                {resource.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">
                  {category?.name ?? "Resource"}
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{resource.title}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
                  {resource.description || "A resource in the NorthStar intelligence graph."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-sky-700"><Network className="h-3.5 w-3.5" /> Resource node</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600"><GitBranch className="h-3.5 w-3.5" /> {connectionCount} graph connection{connectionCount === 1 ? "" : "s"}</span>
                  {activeRelationshipTypeCount > 0 && <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">{activeRelationshipTypeCount} relationship type{activeRelationshipTypeCount === 1 ? "" : "s"}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleBookmark} disabled={bookmarkMutation.isPending}>
                {isBookmarked ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
                {isBookmarked ? "Saved" : "Save"}
              </Button>
              <SuggestResourceEditDialog resource={resource} isAuthenticated={isAuthenticated} />
              <ReportResourceDialog resourceId={resource.id} isAuthenticated={isAuthenticated} />
              <Button variant="outline" onClick={handleShare}>
                {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Share2 className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button variant="outline" onClick={handleNativeShare}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button variant="outline" onClick={handleLinkedInShare} aria-label="Share on LinkedIn">
                in
              </Button>
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button className="bg-sky-600 text-white hover:bg-sky-700">
                  <ExternalLink className="mr-2 h-4 w-4" /> Visit resource
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main>
            <Card className="border-slate-200 bg-white p-6 md:p-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Pricing</p>
                  <p className="mt-2 font-semibold capitalize text-slate-900">{resource.pricing.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">License</p>
                  <p className="mt-2 font-semibold text-slate-900">{resource.license || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Built By</p>
                  {resource.builtByUrl ? (
                    <a className="mt-2 block font-semibold text-sky-600 hover:text-sky-700" href={resource.builtByUrl} target="_blank" rel="noopener noreferrer">
                      {resource.builtBy || "Unknown"}
                    </a>
                  ) : (
                    <p className="mt-2 font-semibold text-slate-900">{resource.builtBy || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Community signal</p>
                  <p className="mt-2 font-semibold text-slate-900">{resource.upvotes} upvotes</p>
                </div>
              </div>
            </Card>

            <section className="mt-8">
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Knowledge graph</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Explore connected resources</h2>
              </div>
              <Tabs defaultValue="alternatives">
                <TabsList className="mb-6 flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm sm:flex-wrap">
                  {RELATIONSHIP_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex-1 px-3 py-2 text-xs sm:text-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {RELATIONSHIP_TABS.map((tab) => {
                  const relationships = tabData[tab.value as keyof typeof tabData] as any[];
                  return (
                    <TabsContent key={tab.value} value={tab.value} className="mt-0">
                      {relationships.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {relationships.map((relationship) => (
                            <RelationshipCard key={relationship.id} relationship={relationship} />
                          ))}
                        </div>
                      ) : (
                        <Card className="border-dashed border-slate-300 bg-white p-10 text-center">
                          <LinkIcon className="mx-auto mb-4 h-8 w-8 text-slate-300" />
                          <h3 className="font-semibold text-slate-900">No verified connections yet</h3>
                          <p className="mt-2 text-sm text-slate-500">Community relationships will appear here after moderation.</p>
                        </Card>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </section>
          </main>

          <aside className="self-start space-y-5 lg:sticky lg:top-24">
            <Card className="border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-950">Community feedback</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Vote on whether this resource is useful to the community.</p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant={userVote === "upvote" ? "default" : "outline"}
                  onClick={() => handleVote("upvote")}
                  disabled={voteMutation.isPending}
                  className="flex-1"
                >
                  <ThumbsUp className="mr-2 h-4 w-4" /> Upvote
                </Button>
                <Button
                  variant={userVote === "downvote" ? "default" : "outline"}
                  onClick={() => handleVote("downvote")}
                  disabled={voteMutation.isPending}
                  className="flex-1"
                >
                  <ThumbsDown className="mr-2 h-4 w-4" /> Downvote
                </Button>
              </div>
              {!isAuthenticated && <p className="mt-3 text-xs text-slate-500">Sign in to vote or save this resource.</p>}
            </Card>

            <Card className="border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-950">Organize this resource</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Add this node to a curated stack so you can revisit it with related tools.</p>
              {isAuthenticated ? (
                collections.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    <label htmlFor="collection-picker" className="sr-only">Choose a collection</label>
                    <select id="collection-picker" value={selectedCollectionId} onChange={(event) => setSelectedCollectionId(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                      <option value="">Choose a collection</option>
                      {collections.map((collection: any) => <option key={collection.id} value={collection.id}>{collection.name}{collection.isPublic ? " · Public" : " · Private"}</option>)}
                    </select>
                    <Button type="button" className="w-full bg-sky-600 text-white hover:bg-sky-700" onClick={handleAddToCollection} disabled={addToCollectionMutation.isPending || !selectedCollectionId}>{addToCollectionMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…</> : "Add to collection"}</Button>
                  </div>
                ) : <p className="mt-4 text-sm text-slate-500">No collections yet. <Link href="/collections" className="font-medium text-sky-700 hover:text-sky-900">Create one</Link> to organize this resource.</p>
              ) : <p className="mt-4 text-xs text-slate-500">Sign in to organize resources into collections.</p>}
            </Card>

            <Card className="border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-950">Resource details</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="text-right font-medium text-slate-900">{category?.name ?? "Not specified"}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Views</dt>
                  <dd className="text-right font-medium text-slate-900">{resource.views}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">URL</dt>
                  <dd className="max-w-[160px] truncate text-right font-medium text-sky-600">{resource.url}</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
