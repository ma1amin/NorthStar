import { useLocation, useRoute } from "wouter";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Filter, X } from "lucide-react";

export default function Browse() {
  const [, params] = useRoute("/browse/:categorySlug");
  const categorySlug = params?.categorySlug;

  const [selectedPricing, setSelectedPricing] = useState<string>("");
  const [sortBy, setSortBy] = useState<"popular" | "newest">("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  // Find selected category
  const selectedCategory = useMemo(() => {
    if (!categories || !categorySlug) return null;
    return categories.find((c) => c.slug === categorySlug);
  }, [categories, categorySlug]);

  // Fetch subcategories if category selected
  const { data: subcategories } = trpc.categories.getSubcategories.useQuery(
    { categoryId: selectedCategory?.id || 0 },
    { enabled: !!selectedCategory }
  );

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  // Fetch resources for selected category
  const { data: categoryResources, isLoading: resourcesLoading } =
    trpc.resources.getByCategory.useQuery(
      {
        categoryId: selectedCategory?.id || 0,
        limit: 1000,
        offset: 0,
      },
      { enabled: !!selectedCategory }
    );

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    if (!categoryResources) return [];

    let filtered = [...categoryResources];

    // Filter by pricing
    if (selectedPricing) {
      filtered = filtered.filter((r) => r.pricing === selectedPricing);
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      filtered.sort((a, b) => b.upvotes - a.upvotes);
    }

    return filtered;
  }, [categoryResources, selectedPricing, sortBy]);

  // Paginate
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setSelectedPricing("");
    setSelectedSubcategory("");
    setSortBy("popular");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-subtle border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/browse">
              <a className="text-accent hover:text-accent/80">Resources</a>
            </Link>
            {selectedCategory && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-900/40" />
                <span className="text-gray-900">{selectedCategory.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20">
              <h3 className="font-serif font-bold text-lg mb-4">Categories</h3>

              {categoriesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {categories?.map((category) => (
                    <Link key={category.id} href={`/browse/${category.slug}`}>
                      <a
                        className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory?.id === category.id
                            ? "bg-accent text-white"
                            : "hover:bg-secondary text-gray-900/80 hover:text-gray-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category.name}</span>
                          {category.icon && <span>{category.icon}</span>}
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              )}

              {/* Filters */}
              {selectedCategory && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </h4>

                  {/* Pricing Filter */}
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">Pricing</label>
                    <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All pricing models" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All pricing models</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="freemium">Freemium</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="open_source">Open Source</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort */}
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  {(selectedPricing || sortBy !== "popular") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {!selectedCategory ? (
              // All categories view
              <div>
                <h1 className="text-4xl font-serif font-bold mb-2">Browse Resources</h1>
                <p className="text-gray-900/70 mb-8">
                  Explore our curated collection of tools, services, and resources organized by category.
                </p>

                {categoriesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories?.map((category) => (
                      <Link key={category.id} href={`/browse/${category.slug}`}>
                        <a className="card-elegant p-8 hover:shadow-elegant-lg transition-all group">
                          <div className="flex items-start justify-between mb-4">
                            {category.icon && <div className="text-4xl">{category.icon}</div>}
                          </div>
                          <h3 className="font-serif font-bold text-xl mb-2 group-hover:text-accent transition-colors">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-gray-900/70 text-sm">{category.description}</p>
                          )}
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Category view with resources
              <div>
                <div className="mb-8">
                  <h1 className="text-4xl font-serif font-bold mb-2">{selectedCategory.name}</h1>
                  {selectedCategory.description && (
                    <p className="text-gray-900/70">{selectedCategory.description}</p>
                  )}
                </div>

                {/* Results info */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-gray-900/60">
                    Showing {paginatedResources.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
                    {Math.min(currentPage * itemsPerPage, filteredResources.length)} of{" "}
                    {filteredResources.length} resources
                  </p>
                </div>

                {/* Resources Grid */}
                {resourcesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : paginatedResources.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {paginatedResources.map((resource) => (
                        <Link key={resource.id} href={`/resource/${resource.slug}`}>
                          <a className="card-elegant p-6 hover:shadow-elegant-lg transition-all group flex flex-col h-full">
                            {resource.logo && (
                              <img
                                src={resource.logo}
                                alt={resource.title}
                                className="w-12 h-12 rounded-lg mb-4 object-cover"
                              />
                            )}
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors line-clamp-2">
                              {resource.title}
                            </h3>
                            <p className="text-sm text-gray-900/70 mb-4 flex-1 line-clamp-3">
                              {resource.description}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                {resource.pricing}
                              </span>
                              {resource.upvotes > 0 && (
                                <span className="text-xs text-gray-900/60">👍 {resource.upvotes}</span>
                              )}
                            </div>
                          </a>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        {[...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i + 1}
                            variant={currentPage === i + 1 ? "default" : "outline"}
                            onClick={() => setCurrentPage(i + 1)}
                            size="sm"
                          >
                            {i + 1}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-900/60">No resources found matching your filters.</p>
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
