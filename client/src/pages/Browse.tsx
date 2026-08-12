import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Loader2,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { applyClientSeo } from "@/lib/seo";
import { useLanguage } from "@/contexts/LanguageContext";

const ITEMS_PER_PAGE = 12;

const PRICING_OPTIONS = [
  { value: "all", label: "All pricing" },
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
  { value: "open_source", label: "Open source" },
  { value: "enterprise", label: "Enterprise" },
] as const;

function formatPricing(value: string) {
  return value.replace("_", " ");
}

export default function Browse() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [, routeParams] = useRoute("/browse/:categorySlug");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | undefined>();
  const [selectedPricing, setSelectedPricing] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"popular" | "newest">("popular");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  useEffect(() => {
    applyClientSeo({ title: "Browse verified resources — NorthStar", description: "Browse verified tools, services, and ecosystems with rich metadata and knowledge-graph context.", canonicalPath: routeParams?.categorySlug ? `/browse/${routeParams.categorySlug}` : "/browse" });
  }, [routeParams?.categorySlug]);

  useEffect(() => {
    if (!routeParams?.categorySlug || categories.length === 0) return;
    const category = categories.find((item) => item.slug === routeParams.categorySlug);
    setSelectedCategoryId(category?.id);
    setSelectedSubcategoryId(undefined);
    setPage(1);
  }, [categories, routeParams?.categorySlug]);

  const subcategoryInput = useMemo(
    () => ({ categoryId: selectedCategoryId ?? 0 }),
    [selectedCategoryId]
  );
  const { data: subcategories = [] } = trpc.categories.getSubcategories.useQuery(subcategoryInput, {
    enabled: selectedCategoryId !== undefined,
  });

  const resourceInput = useMemo(
    () => ({
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(selectedCategoryId !== undefined ? { categoryId: selectedCategoryId } : {}),
      ...(selectedSubcategoryId !== undefined ? { subcategoryId: selectedSubcategoryId } : {}),
      ...(selectedPricing !== "all" ? { pricing: selectedPricing as "free" | "freemium" | "paid" | "open_source" | "enterprise" } : {}),
      ...(tag.trim() ? { tag: tag.trim() } : {}),
      sort,
    }),
    [page, query, selectedCategoryId, selectedSubcategoryId, selectedPricing, tag, sort]
  );

  const {
    data: resourcePage,
    isLoading: resourcesLoading,
    isFetching: resourcesFetching,
    error: resourcesError,
  } = trpc.resources.listFiltered.useQuery(resourceInput, {
    placeholderData: (previous) => previous,
  });

  const resources = resourcePage?.items ?? [];
  const total = resourcePage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const hasFilters = Boolean(query.trim() || tag.trim() || selectedCategoryId || selectedSubcategoryId || selectedPricing !== "all");

  const resetFilters = () => {
    setSelectedCategoryId(undefined);
    setSelectedSubcategoryId(undefined);
    setSelectedPricing("all");
    setQuery("");
    setTag("");
    setPage(1);
    setLocation("/browse");
  };

  const chooseCategory = (categoryId?: number, slug?: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(undefined);
    setPage(1);
    setLocation(slug ? `/browse/${slug}` : "/browse");
  };

  return (
    <div className="min-h-screen bg-transparent">
      <section className="ns-noise border-b border-slate-200/80 bg-white/80">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">
              {t("resourceDirectory")}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              {t("browseHub")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              {t("browseIntro")}
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-10">
        <div className="ns-surface mb-4 flex items-center justify-between gap-3 rounded-2xl p-3 lg:hidden">
          <p className="text-sm font-medium text-slate-500">{t("refineGraph")}</p>
          <Button variant="outline" onClick={() => setMobileFiltersOpen((open) => !open)} className="shrink-0 border-slate-300 bg-white text-slate-700">
            <SlidersHorizontal className="mr-2 h-4 w-4" />{mobileFiltersOpen ? t("hideFilters") : hasFilters ? t("filtersActive") : t("filters")}
          </Button>
        </div>
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className={`${mobileFiltersOpen ? "block animate-fade-in-up" : "hidden"} ns-surface h-fit rounded-2xl p-5 lg:sticky lg:top-24 lg:block`}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-sky-600" />
                <h2 className="font-semibold text-slate-900">{t("filters")}</h2>
              </div>
              {hasFilters && (
                <button onClick={() => { resetFilters(); setMobileFiltersOpen(false); }} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                  {t("clearAll")}
                </button>
              )}
            </div>

            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="browse-search">
              {t("search")}
            </label>
            <div className="relative mb-6">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="browse-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder={t("searchResources")}
                className="pl-9"
              />
            </div>

            <p className="mb-2 text-sm font-semibold text-slate-700">{t("categories")}</p>
            <div className="space-y-1">
              <button
                onClick={() => chooseCategory()}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                  selectedCategoryId === undefined ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("allResources")}
              </button>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("loadingCategories")}
                </div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => chooseCategory(category.id, category.slug)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                      selectedCategoryId === category.id ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {category.name}
                  </button>
                ))
              )}
            </div>

            {selectedCategoryId !== undefined && subcategories.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="mb-2 text-sm font-semibold text-slate-700">{t("subcategories")}</p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedSubcategoryId(undefined);
                      setPage(1);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      selectedSubcategoryId === undefined ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t("allSubcategories")}
                  </button>
                  {subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={() => {
                        setSelectedSubcategoryId(subcategory.id);
                        setPage(1);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                        selectedSubcategoryId === subcategory.id ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="browse-pricing">
                {t("pricingModel")}
              </label>
              <select
                id="browse-pricing"
                value={selectedPricing}
                onChange={(event) => {
                  setSelectedPricing(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {PRICING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === "all" ? t("allPricing") : option.value === "free" ? t("free") : option.value === "paid" ? t("paid") : option.value === "open_source" ? t("openSource") : option.value === "enterprise" ? t("enterprise") : option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="browse-tag">
                {t("tag")}
              </label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="browse-tag"
                  value={tag}
                  onChange={(event) => {
                    setTag(event.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. collaboration"
                  className="pl-9"
                />
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {resourcesFetching && !resourcesLoading ? t("updatingResults") : `${t("showing")} ${resources.length} ${t("of")} ${total} ${t("resources")}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="browse-sort">{t("sortResources")}</label>
                <select
                  id="browse-sort"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as "popular" | "newest");
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="popular">{t("mostPopular")}</option>
                  <option value="newest">{t("newest")}</option>
                </select>
                <div className="flex rounded-lg border border-slate-200 p-1">
                  <button
                    aria-label={t("gridView")}
                    onClick={() => setViewMode("grid")}
                    className={`rounded-md p-2 ${viewMode === "grid" ? "bg-sky-50 text-sky-700" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={t("listView")}
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-2 ${viewMode === "list" ? "bg-sky-50 text-sky-700" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {resourcesLoading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                ))}
              </div>
            ) : resourcesError ? (
              <Card className="p-10 text-center">
                <h2 className="text-xl font-semibold text-slate-900">{t("unableToLoadResources")}</h2>
                <p className="mt-2 text-slate-500">{t("tryAgain")}</p>
              </Card>
            ) : resources.length === 0 ? (
              <Card className="p-10 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                <h2 className="text-xl font-semibold text-slate-900">{t("noMatchingResources")}</h2>
                <p className="mt-2 text-slate-500">{t("broadenSearch")}</p>
                {hasFilters && (
                  <Button onClick={resetFilters} className="mt-5 bg-sky-600 text-white hover:bg-sky-700">
                    <X className="mr-2 h-4 w-4" /> {t("clearFilters")}
                  </Button>
                )}
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid gap-5 md:grid-cols-2" : "space-y-4"}>
                {resources.map((resource) => (
                  <Link
                    key={resource.id}
                    href={`/resource/${resource.slug}`}
                    className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    <Card className={`h-full border-slate-200 p-6 transition-all group-hover:-translate-y-0.5 group-hover:border-sky-200 group-hover:shadow-lg ${viewMode === "list" ? "md:flex md:items-center md:justify-between" : ""}`}>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-600">
                              {resource.categoryName ?? t("uncategorized")}
                            </p>
                            <h2 className="text-xl font-semibold text-slate-950 group-hover:text-sky-700">
                              {resource.title}
                            </h2>
                          </div>
                          {resource.featured && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{t("featured")}</span>}
                        </div>
                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                          {resource.description || t("noDescriptionAdded")}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 md:mt-5">
                        <span>{resource.subcategoryName ?? "Resource"}</span>
                        <span className="capitalize">{formatPricing(resource.pricing)}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label={t("previous")}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> {t("previous")}
                </Button>
                <span className="text-sm font-medium text-slate-600">{t("page")} {page} {t("of")} {totalPages}</span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  aria-label={t("next")}
                >
                  {t("next")} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
