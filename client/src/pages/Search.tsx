import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, TrendingUp, Lightbulb } from "lucide-react";

export default function Search() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"results" | "suggestions">("results");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data: searchResults, isLoading: resultsLoading } =
    trpc.search.advancedSearch.useQuery(
      { query: debouncedQuery, limit: 50 },
      { enabled: debouncedQuery.length > 0 }
    );

  // Fetch search suggestions
  const { data: suggestions, isLoading: suggestionsLoading } =
    trpc.search.getSuggestions.useQuery(
      { query: debouncedQuery, limit: 5 },
      { enabled: debouncedQuery.length > 2 }
    );

  // Fetch trending searches
  const { data: trending } = trpc.search.getTrending.useQuery({ limit: 5 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setDebouncedQuery(suggestion);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Search Header */}
      <div className="bg-gradient-to-br from-background via-background to-secondary/20 py-12 md:py-16">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mb-8">
            Find Resources
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search resources, try 'Jira alternatives' or 'Slack integrations'..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-elegant pl-10 text-lg h-12"
                autoFocus
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-900/40" />
            </div>
          </form>

          {/* Help text */}
          <p className="text-center text-sm text-gray-900/60 mt-4">
            💡 Try searching for alternatives, integrations, or competitors
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Empty state - no query */}
        {!debouncedQuery ? (
          <div className="max-w-2xl mx-auto">
            {/* Trending Section */}
            {trending && trending.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-accent" />
                  Trending Now
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trending.map((term: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(term)}
                      className="card-elegant p-4 text-left hover:shadow-elegant-lg transition-all group"
                    >
                      <p className="font-semibold group-hover:text-accent transition-colors">{term}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions Section */}
            <div>
              <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-accent" />
                Try These Searches
              </h2>
              <div className="space-y-3">
                {[
                  "Jira alternatives",
                  "Slack integrations",
                  "GitHub competitors",
                  "Figma similar tools",
                  "Notion alternatives",
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full card-elegant p-4 text-left hover:shadow-elegant-lg transition-all group"
                  >
                    <p className="font-medium group-hover:text-accent transition-colors">{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Results view
          <div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="results">
                  Results {searchResults && `(${searchResults.length})`}
                </TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>

              {/* Results Tab */}
              <TabsContent value="results">
                {resultsLoading ? (
                  <div className="grid gap-4">
                    {[...Array(5)].map((_: any, i: number) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-900/60 mb-6">
                      Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "
                      <span className="font-semibold">{debouncedQuery}</span>"
                    </p>

                    {searchResults.map((resource: any) => (
                      <Link key={resource.id} href={`/resource/${resource.slug}`}>
                        <a className="card-elegant p-6 hover:shadow-elegant-lg transition-all group">
                          <div className="flex gap-4">
                            {resource.logo && (
                              <img
                                src={resource.logo}
                                alt={resource.title}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg group-hover:text-accent transition-colors mb-1 line-clamp-1">
                                {resource.title}
                              </h3>
                              <p className="text-sm text-gray-900/70 mb-3 line-clamp-2">
                                {resource.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                  {resource.pricing}
                                </span>
                                {resource.upvotes > 0 && (
                                  <span className="text-xs text-gray-900/60">👍 {resource.upvotes}</span>
                                )}
                                {resource.views > 0 && (
                                  <span className="text-xs text-gray-900/60">👁 {resource.views}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-900/60 mb-4">No results found for "{debouncedQuery}"</p>
                    <p className="text-sm text-gray-900/50 mb-6">
                      Try a different search term or browse by category
                    </p>
                    <Link href="/browse">
                      <a>
                        <Button variant="outline">Browse Categories</Button>
                      </a>
                    </Link>
                  </div>
                )}
              </TabsContent>

              {/* Suggestions Tab */}
              <TabsContent value="suggestions">
                {suggestionsLoading ? (
                  <div className="grid gap-4">
                    {[...Array(3)].map((_: any, i: number) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : suggestions ? (
                  <div className="space-y-4">
                    {/* Resource suggestions */}
                    {suggestions.resources && suggestions.resources.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Resources</h3>
                        <div className="space-y-2">
                          {suggestions.resources.map((resource: any) => (
                            <Link key={resource.id} href={`/resource/${resource.slug}`}>
                              <a className="block p-3 rounded-lg hover:bg-secondary transition-colors">
                                <p className="font-medium hover:text-accent transition-colors">
                                  {resource.title}
                                </p>
                              </a>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Query suggestions */}
                    {suggestions.suggestions && suggestions.suggestions.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Try These Searches</h3>
                        <div className="space-y-2">
                          {suggestions.suggestions.map((suggestion: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors"
                            >
                              <p className="font-medium hover:text-accent transition-colors">{suggestion}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
