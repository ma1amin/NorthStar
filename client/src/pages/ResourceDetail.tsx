import { useRoute } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ExternalLink,
  Heart,
  Share2,
  ChevronRight,
  Bookmark,
  ThumbsUp,
  Users,
  Link as LinkIcon,
  Code,
} from "lucide-react";

export default function ResourceDetail() {
  const [, params] = useRoute("/resource/:slug");
  const slug = params?.slug;
  const { isAuthenticated, user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);

  // Fetch resource
  const { data: resource, isLoading: resourceLoading } = trpc.resources.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Fetch relationships
  const { data: alternatives } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id || 0, type: "alternative_to" },
    { enabled: !!resource }
  );

  const { data: integrations } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id || 0, type: "integrates_with" },
    { enabled: !!resource }
  );

  const { data: competitors } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id || 0, type: "competitor_of" },
    { enabled: !!resource }
  );

  const { data: similar } = trpc.relationships.getBySource.useQuery(
    { sourceId: resource?.id || 0, type: "similar_to" },
    { enabled: !!resource }
  );

  // Fetch user's vote
  const { data: vote } = trpc.votes.getResourceVote.useQuery(
    { resourceId: resource?.id || 0 },
    { enabled: !!resource && isAuthenticated }
  );

  // Fetch bookmark status
  const { data: bookmarked } = trpc.bookmarks.isBookmarked.useQuery(
    { resourceId: resource?.id || 0 },
    { enabled: !!resource && isAuthenticated }
  );

  const voteResourceMutation = trpc.votes.voteResource.useMutation();
  const toggleBookmarkMutation = trpc.bookmarks.toggle.useMutation();

  const handleVote = (type: "upvote" | "downvote") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    voteResourceMutation.mutate(
      { resourceId: resource?.id || 0, type },
      {
        onSuccess: () => {
          setUserVote(userVote === type ? null : type);
        },
      }
    );
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    toggleBookmarkMutation.mutate(
      { resourceId: resource?.id || 0 },
      {
        onSuccess: (data) => {
          setIsBookmarked(data.bookmarked);
        },
      }
    );
  };

  if (resourceLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Resource Not Found</h1>
        <p className="text-gray-900/70 mb-8">The resource you're looking for doesn't exist.</p>
        <Link href="/browse">
          <a>
            <Button>Browse Resources</Button>
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-subtle border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/browse">
              <a className="text-accent hover:text-accent/80">Resources</a>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-900/40" />
            <span className="text-gray-900">{resource.title}</span>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <main className="lg:col-span-2">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start gap-4 mb-6">
                {resource.logo && (
                  <img
                    src={resource.logo}
                    alt={resource.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-serif font-bold mb-2">{resource.title}</h1>
                  {resource.builtBy && (
                    <p className="text-gray-900/60">
                      Built by{" "}
                      {resource.builtByUrl ? (
                        <a
                          href={resource.builtByUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80"
                        >
                          {resource.builtBy}
                        </a>
                      ) : (
                        resource.builtBy
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {resource.description && (
                <p className="text-lg text-gray-900/80 mb-6">{resource.description}</p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900/60">Pricing:</span>
                  <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                    {resource.pricing}
                  </span>
                </div>

                {resource.license && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900/60">License:</span>
                    <span className="text-sm">{resource.license}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900/60">Views:</span>
                  <span className="text-sm">{resource.views}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Visit Resource
                  </Button>
                </a>

                <Button
                  variant="outline"
                  onClick={handleBookmark}
                  className={isBookmarked ? "bg-accent/10" : ""}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </Button>

                <Button variant="outline" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Relationship Tabs */}
            <Tabs defaultValue="alternatives" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="competitors">Competitors</TabsTrigger>
                <TabsTrigger value="similar">Similar</TabsTrigger>
              </TabsList>

              {/* Alternatives Tab */}
              <TabsContent value="alternatives">
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-lg">Alternative Tools</h3>
                  {alternatives && alternatives.length > 0 ? (
                    <div className="grid gap-4">
                      {alternatives.map((rel) => (
                        <Link key={rel.id} href={`/resource/${rel.targetId}`}>
                          <a className="card-elegant p-4 hover:shadow-elegant-lg transition-all group">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold group-hover:text-accent transition-colors">
                                  Related Resource
                                </h4>
                                <p className="text-sm text-gray-900/60">
                                  Strength: {(parseFloat(rel.strength.toString()) * 100).toFixed(0)}%
                                </p>
                              </div>
                              {rel.verified && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Verified
                                </span>
                              )}
                            </div>
                          </a>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900/60">No alternatives found yet.</p>
                  )}
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations">
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-lg">Integrations</h3>
                  {integrations && integrations.length > 0 ? (
                    <div className="grid gap-4">
                      {integrations.map((rel) => (
                        <div key={rel.id} className="card-elegant p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">Integrates With</h4>
                              <p className="text-sm text-gray-900/60">
                                Strength: {(parseFloat(rel.strength.toString()) * 100).toFixed(0)}%
                              </p>
                            </div>
                            {rel.verified && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900/60">No integrations found yet.</p>
                  )}
                </div>
              </TabsContent>

              {/* Competitors Tab */}
              <TabsContent value="competitors">
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-lg">Competitors</h3>
                  {competitors && competitors.length > 0 ? (
                    <div className="grid gap-4">
                      {competitors.map((rel) => (
                        <div key={rel.id} className="card-elegant p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">Competitor</h4>
                              <p className="text-sm text-gray-900/60">
                                Strength: {(parseFloat(rel.strength.toString()) * 100).toFixed(0)}%
                              </p>
                            </div>
                            {rel.verified && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900/60">No competitors found yet.</p>
                  )}
                </div>
              </TabsContent>

              {/* Similar Tab */}
              <TabsContent value="similar">
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-lg">Similar Resources</h3>
                  {similar && similar.length > 0 ? (
                    <div className="grid gap-4">
                      {similar.map((rel) => (
                        <div key={rel.id} className="card-elegant p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">Similar To</h4>
                              <p className="text-sm text-gray-900/60">
                                Strength: {(parseFloat(rel.strength.toString()) * 100).toFixed(0)}%
                              </p>
                            </div>
                            {rel.verified && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900/60">No similar resources found yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Voting Card */}
              <div className="card-elegant p-6">
                <h3 className="font-semibold mb-4">Community Feedback</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant={userVote === "upvote" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVote("upvote")}
                    className="flex-1"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <span className="font-semibold text-lg">{resource.upvotes}</span>
                </div>
              </div>

              {/* Info Card */}
              <div className="card-elegant p-6">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-900/60 mb-1">Pricing Model</p>
                    <p className="font-medium capitalize">{resource.pricing}</p>
                  </div>

                  {resource.license && (
                    <div>
                      <p className="text-gray-900/60 mb-1">License</p>
                      <p className="font-medium">{resource.license}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-900/60 mb-1">Added</p>
                    <p className="font-medium">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="card-elegant p-6">
                <h3 className="font-semibold mb-4">Share</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
