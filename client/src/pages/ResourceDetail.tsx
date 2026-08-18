import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { applyClientSeo } from "@/lib/seo";
import { ReportResourceDialog } from "@/components/ReportResourceDialog";
import { SuggestResourceEditDialog } from "@/components/SuggestResourceEditDialog";
import { SubmitSourceDialog } from "@/components/SubmitSourceDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { ResourceIcon } from "@/components/ResourceIcon";

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
  const { isAuthenticated, startLogin } = useAuth();
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const { data: vote } = trpc.votes.getRelationshipVote.useQuery(
    { relationshipId: relationship.id },
    { enabled: Boolean(relationship.id && isAuthenticated) }
  );
  const voteMutation = trpc.votes.voteRelationship.useMutation({
    onSuccess: async () => {
      toast.success(t("relationshipVoteSaved"));
      await utils.votes.getRelationshipVote.invalidate({ relationshipId: relationship.id });
    },
    onError: () => toast.error(t("relationshipVoteError")),
  });

  useEffect(() => {
    setUserVote((vote?.type as "upvote" | "downvote" | undefined) ?? null);
  }, [vote?.type]);

  if (!target) return null;

  const handleVote = (type: "upvote" | "downvote") => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    voteMutation.mutate({ relationshipId: relationship.id, type });
  };

  return (
    <Card className="ns-hover-lift group border-slate-200/90 bg-white/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-600">
            {relationship.type === "alternative_to" ? t("alternativeTo") : relationship.type === "similar_to" ? t("similarTo") : relationship.type === "integrates_with" ? t("integratesWith") : relationship.type === "built_by" ? t("builtBy") : relationship.type === "maintained_by" ? t("maintainedBy") : relationship.type === "funded_by" ? t("fundedBy") : relationship.type === "used_by" ? t("usedBy") : relationship.type === "depends_on" ? t("dependsOn") : relationship.type === "part_of" ? t("partOf") : relationship.type === "competitor_of" ? t("competitorOf") : relationship.type}
          </p>
          <Link href={`/resource/${target.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <h3 className="mt-2 text-lg font-semibold text-slate-950 group-hover:text-sky-700">{target.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{target.description || t("connectedResource")}</p>
          </Link>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {Math.round(Number(relationship.strength) * 100)}% {t("strength")}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="capitalize">{target.pricing?.replace("_", " ")}</span>
        {relationship.verified && <span className="text-emerald-600">{t("verifiedRelationship")}</span>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{t("connectionUseful")}</span>
        <div className="flex gap-1.5">
          <Button type="button" size="sm" variant={userVote === "upvote" ? "default" : "outline"} aria-label={`${t("upvote")} ${target.title}`} onClick={() => handleVote("upvote")} disabled={voteMutation.isPending}><ThumbsUp className="h-3.5 w-3.5" /></Button>
          <Button type="button" size="sm" variant={userVote === "downvote" ? "default" : "outline"} aria-label={`${t("downvote")} ${target.title}`} onClick={() => handleVote("downvote")} disabled={voteMutation.isPending}><ThumbsDown className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </Card>
  );
}

export default function ResourceDetail() {
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? "";
  const { isAuthenticated, startLogin } = useAuth();
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");

  const { data: resource, isLoading: resourceLoading } = trpc.resources.getBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug), retry: false, networkMode: "always" }
  );
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: trustContext } = trpc.resources.getTrustContext.useQuery(
    { resourceId: resource?.id ?? 0 },
    { enabled: Boolean(resource?.id) }
  );
  const { data: graphPreview } = trpc.graph.neighborhood.useQuery(
    { resourceId: resource?.id ?? 0, maxEdges: 12 },
    { enabled: Boolean(resource?.id) }
  );
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
      toast.success(t("voteSaved"));
      await utils.votes.getResourceVote.invalidate({ resourceId: resource?.id ?? 0 });
      await utils.resources.getBySlug.invalidate({ slug });
    },
    onError: () => toast.error(t("voteError")),
  });
  const bookmarkMutation = trpc.bookmarks.toggle.useMutation({
    onSuccess: async (result) => {
      setIsBookmarked(result.bookmarked);
      toast.success(result.bookmarked ? t("resourceSaved") : t("resourceRemoved"));
      await utils.bookmarks.isBookmarked.invalidate({ resourceId: resource?.id ?? 0 });
    },
    onError: () => {
      setIsBookmarked(Boolean(bookmarked));
      toast.error(t("savedItemsError"));
    },
  });
  const addToCollectionMutation = trpc.collections.addResource.useMutation({
    onSuccess: async () => {
      toast.success(t("resourceAddedToCollection"));
      await utils.collections.getResources.invalidate({ collectionId: Number(selectedCollectionId) });
    },
    onError: (error) => toast.error(error.message || t("addToCollectionError")),
  });

  const handleProtectedAction = () => {
    startLogin();
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
      toast.info(t("chooseCollectionFirst"));
      return;
    }
    addToCollectionMutation.mutate({ collectionId: Number(selectedCollectionId), resourceId: resource.id });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t("linkCopied"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      toast.error(t("copyLinkError"));
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.info(t("nativeShareUnavailable"));
      await handleShare();
      return;
    }
    try {
      await navigator.share({
        title: resource?.title,
        text: resource?.description ?? t("resourceGraphDescription"),
        url: window.location.href,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(t("shareDialogError"));
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
        <h1 className="text-3xl font-bold text-slate-950">{t("resourceNotFound")}</h1>
        <p className="mt-3 text-slate-600">{t("resourceUnavailable")}</p>
        <Link href="/browse">
          <Button className="mt-6 bg-sky-600 text-white hover:bg-sky-700">{t("browseResources")}</Button>
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
    <div className="min-h-screen bg-transparent">
      <section className="ns-noise border-b border-slate-200/80 bg-white/80">
        <div className="container py-6 md:py-10">
          <Link href="/browse" className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
            <ArrowLeft className="h-4 w-4" /> {t("backToBrowse")}
          </Link>
          {slug !== resource.slug && (
            <Card className="mt-5 border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-950">
              <p className="font-medium">{t("aliasNotice")}</p>
              <Link href={`/resource/${resource.slug}`} className="mt-2 inline-flex font-semibold text-sky-700 hover:text-sky-900">
                {resource.title}
              </Link>
            </Card>
          )}
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
              <ResourceIcon logo={resource.logo} title={resource.title} priority className="ns-glow-ring h-16 w-16 rounded-2xl shadow-lg" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">
                  {category?.name ?? t("resourceNode")}
                </p>
                <h1 className="ns-resource-title-hero mt-2 text-slate-950">{resource.title}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
                  {resource.description || t("resourceGraphDescription")}
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-sky-700"><Network className="h-3.5 w-3.5" /> {t("resourceNode")}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600"><GitBranch className="h-3.5 w-3.5" /> {connectionCount} {t("connections")}</span>
                  {activeRelationshipTypeCount > 0 && <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">{activeRelationshipTypeCount} {t("relationshipTypes")}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleBookmark} disabled={bookmarkMutation.isPending}>
                {isBookmarked ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
                {isBookmarked ? t("saved") : t("save")}
              </Button>
              <Link href={`/graph/${resource.slug}`}><Button variant="outline"><GitBranch className="mr-2 h-4 w-4" /> {t("openGraph")}</Button></Link>
              <SuggestResourceEditDialog resource={resource} isAuthenticated={isAuthenticated} />
              <ReportResourceDialog resourceId={resource.id} isAuthenticated={isAuthenticated} />
              <Button variant="outline" onClick={handleShare}>
                {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Share2 className="mr-2 h-4 w-4" />}
                {copied ? t("copied") : t("copyLink")}
              </Button>
              <Button variant="outline" onClick={handleNativeShare}>
                <Share2 className="mr-2 h-4 w-4" /> {t("share")}
              </Button>
              <Button variant="outline" onClick={handleLinkedInShare} aria-label={`${t("share")} LinkedIn`}>
                in
              </Button>
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button className="bg-sky-600 text-white hover:bg-sky-700">
                  <ExternalLink className="mr-2 h-4 w-4" /> {t("visitResource")}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main>
            <Card className="ns-surface-strong border-slate-200/90 p-6 md:p-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("pricing")}</p>
                  <p className="mt-2 font-semibold capitalize text-slate-900">{resource.pricing.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">License</p>
                  <p className="mt-2 font-semibold text-slate-900">{resource.license || t("notSpecified")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("builtBy")}</p>
                  {resource.builtByUrl ? (
                    <a className="mt-2 block font-semibold text-sky-600 hover:text-sky-700" href={resource.builtByUrl} target="_blank" rel="noopener noreferrer">
                      {resource.builtBy || t("unknown")}
                    </a>
                  ) : (
                    <p className="mt-2 font-semibold text-slate-900">{resource.builtBy || t("notSpecified")}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("communitySignal")}</p>
                  <p className="mt-2 font-semibold text-slate-900">{resource.upvotes} {t("upvotes")}</p>
                </div>
              </div>
            </Card>

            <section className="mt-8">
              <Card className="ns-surface border-sky-100 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.10),transparent_42%),linear-gradient(145deg,#ffffff,#f8fbff)] p-6 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Interactive node preview</p><h2 className="mt-2 text-2xl font-bold text-slate-950">Explore real connected resources</h2><p className="mt-2 text-sm leading-6 text-slate-600">Select an approved neighbor to continue discovery, or open the full bounded graph with evidence links and filters.</p></div><Link href={`/graph/${resource.slug}`}><Button variant="outline"><Network className="mr-2 h-4 w-4" />{t("openGraph")}</Button></Link></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><div className="flex min-h-24 items-center gap-3 rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white"><ResourceIcon logo={resource.logo} title={resource.title} className="h-10 w-10 rounded-xl" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-300">Focus</p><p className="mt-1 truncate font-semibold">{resource.title}</p></div></div>{graphPreview?.nodes?.slice(0, 5).map((node) => <Link key={node.id} href={`/resource/${node.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><span className="flex items-center gap-3"><ResourceIcon logo={node.logo} title={node.title} className="h-10 w-10 rounded-xl" /><span className="min-w-0"><span className="block truncate font-semibold text-slate-950 group-hover:text-sky-700">{node.title}</span><span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">{node.description || t("connectedResource")}</span></span></span></Link>)}</div>{graphPreview && graphPreview.nodes.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-600">{t("graphNoEdgesDescription")}</p>}</Card>
            </section>

            <section className="mt-8">
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">{t("knowledgeGraph")}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">{t("exploreConnected")}</h2>
              </div>
              <Tabs defaultValue="alternatives">
                <TabsList className="ns-surface mb-6 flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-2xl bg-white/75 p-1 shadow-sm sm:flex-wrap">
                  {RELATIONSHIP_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex-1 px-3 py-2 text-xs sm:text-sm">
                      {tab.value === "alternatives" ? t("alternatives") : tab.value === "integrations" ? t("integrations") : tab.value === "competitors" ? t("competitors") : tab.value === "ecosystem" ? t("ecosystem") : t("similarTools")}
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
                        <Card className="ns-surface border-dashed border-slate-300 p-10 text-center">
                          <LinkIcon className="mx-auto mb-4 h-8 w-8 text-slate-300" />
                          <h3 className="font-semibold text-slate-900">{t("noVerifiedConnections")}</h3>
                          <p className="mt-2 text-sm text-slate-500">{t("relationshipAfterModeration")}</p>
                        </Card>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </section>
          </main>

          <aside className="self-start space-y-5 lg:sticky lg:top-24">
            <Card className="ns-surface border-slate-200/90 p-6">
              <h2 className="font-semibold text-slate-950">{t("communityFeedback")}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{t("feedbackGuidance")}</p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant={userVote === "upvote" ? "default" : "outline"}
                  onClick={() => handleVote("upvote")}
                  disabled={voteMutation.isPending}
                  className="flex-1"
                >
                  <ThumbsUp className="mr-2 h-4 w-4" /> {t("upvote")}
                </Button>
                <Button
                  variant={userVote === "downvote" ? "default" : "outline"}
                  onClick={() => handleVote("downvote")}
                  disabled={voteMutation.isPending}
                  className="flex-1"
                >
                  <ThumbsDown className="mr-2 h-4 w-4" /> {t("downvote")}
                </Button>
              </div>
              {!isAuthenticated && <p className="mt-3 text-xs text-slate-500">{t("signInToVote")}</p>}
            </Card>

            <Card className="ns-surface border-slate-200/90 p-6">
              <h2 className="font-semibold text-slate-950">{t("organizeResource")}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{t("organizeGuidance")}</p>
              {isAuthenticated ? (
                collections.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    <label htmlFor="collection-picker" className="sr-only">{t("chooseCollection")}</label>
                    <select id="collection-picker" value={selectedCollectionId} onChange={(event) => setSelectedCollectionId(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                      <option value="">{t("chooseCollection")}</option>
                      {collections.map((collection: any) => <option key={collection.id} value={collection.id}>{collection.name}{collection.isPublic ? ` · ${t("public")}` : ` · ${t("private")}`}</option>)}
                    </select>
                    <Button type="button" className="w-full bg-sky-600 text-white hover:bg-sky-700" onClick={handleAddToCollection} disabled={addToCollectionMutation.isPending || !selectedCollectionId}>{addToCollectionMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("adding")}</> : t("addToCollection")}</Button>
                  </div>
                ) : <p className="mt-4 text-sm text-slate-500">{t("noCollectionsYet")}. <Link href="/collections" className="font-medium text-sky-700 hover:text-sky-900">{t("createOne")}</Link> {t("organizeResource").toLowerCase()}.</p>
              ) : <p className="mt-4 text-xs text-slate-500">{t("organizeSignIn")}</p>}
            </Card>

            <Card className="ns-surface border-slate-200/90 p-6">
              <h2 className="font-semibold text-slate-950">{t("resourceDetails")}</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">{t("category")}</dt>
                  <dd className="text-right font-medium text-slate-900">{category?.name ?? t("notSpecified")}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">{t("views")}</dt>
                  <dd className="text-right font-medium text-slate-900">{resource.views}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">URL</dt>
                  <dd className="max-w-[160px] truncate text-right font-medium text-sky-600">{resource.url}</dd>
                </div>
              </dl>
            </Card>

            <Card className="ns-surface border-slate-200/90 p-6">
              <h2 className="font-semibold text-slate-950">{t("trustContext")}</h2>
              <div className="mt-5 space-y-5 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("freshness")}</p>
                  {trustContext?.freshness ? <div className="mt-2"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${trustContext.freshness.status === "current" ? "bg-emerald-50 text-emerald-700" : trustContext.freshness.status === "stale" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{trustContext.freshness.status === "current" ? t("current") : trustContext.freshness.status === "stale" ? t("stale") : t("needsReview")}</span><p className="mt-2 text-xs text-slate-500">{t("lastChecked")} {new Date(trustContext.freshness.checkedAt).toLocaleDateString()}</p>{trustContext.freshness.note && <p className="mt-2 leading-5 text-slate-600">{trustContext.freshness.note}</p>}</div> : <p className="mt-2 text-slate-500">{t("needsReview")}</p>}
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("evidenceSources")}</p>
                  {trustContext?.sources?.length ? <ul className="mt-2 space-y-2">{trustContext.sources.slice(0, 3).map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="block truncate font-medium text-sky-700 hover:text-sky-900">{source.attribution || source.url}</a><p className="mt-0.5 text-xs capitalize text-slate-500">{source.sourceType}</p></li>)}</ul> : <p className="mt-2 text-slate-500">{t("noApprovedEvidence")}</p>}
                  <div className="mt-4"><SubmitSourceDialog resourceId={resource.id} isAuthenticated={isAuthenticated} /></div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("publicHistory")}</p>
                  {trustContext?.history?.length ? <ul className="mt-2 space-y-2">{trustContext.history.slice(0, 3).map((event) => <li key={event.id}><p className="leading-5 text-slate-700">{event.summary}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(event.createdAt).toLocaleDateString()}</p></li>)}</ul> : <p className="mt-2 text-slate-500">{t("noPublicHistory")}</p>}
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
