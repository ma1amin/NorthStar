import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ChevronRight, Grid, List, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const ITEMS_PER_PAGE = 12;

const MOCK_RESOURCES = [
  {
    id: 1,
    title: 'Figma',
    slug: 'figma',
    description: 'Collaborative design tool for UI/UX design',
    category: 'Design Tools',
    tags: ['design', 'collaboration', 'ui-ux'],
    pricing: 'freemium',
    rating: 4.8,
    votes: 234,
  },
  {
    id: 2,
    title: 'Jira',
    slug: 'jira',
    description: 'Project management and issue tracking',
    category: 'Project Management',
    tags: ['project-management', 'agile', 'tracking'],
    pricing: 'paid',
    rating: 4.6,
    votes: 189,
  },
  {
    id: 3,
    title: 'Notion',
    slug: 'notion',
    description: 'All-in-one workspace for notes and databases',
    category: 'Productivity',
    tags: ['productivity', 'notes', 'database'],
    pricing: 'freemium',
    rating: 4.7,
    votes: 312,
  },
  {
    id: 4,
    title: 'Linear',
    slug: 'linear',
    description: 'Modern issue tracking for software teams',
    category: 'Project Management',
    tags: ['project-management', 'issue-tracking', 'agile'],
    pricing: 'paid',
    rating: 4.9,
    votes: 156,
  },
  {
    id: 5,
    title: 'Slack',
    slug: 'slack',
    description: 'Team communication and messaging platform',
    category: 'Communication',
    tags: ['communication', 'messaging', 'team'],
    pricing: 'freemium',
    rating: 4.5,
    votes: 278,
  },
  {
    id: 6,
    title: 'GitHub',
    slug: 'github',
    description: 'Version control and collaboration platform',
    category: 'Development',
    tags: ['development', 'version-control', 'collaboration'],
    pricing: 'freemium',
    rating: 4.8,
    votes: 401,
  },
];

const CATEGORIES = [
  { name: 'All', count: 5000 },
  { name: 'Design Tools', count: 234 },
  { name: 'Project Management', count: 456 },
  { name: 'Productivity', count: 789 },
  { name: 'Communication', count: 345 },
  { name: 'Development', count: 678 },
];

const PRICING_MODELS = [
  { value: 'all', label: 'All Pricing' },
  { value: 'free', label: 'Free' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'paid', label: 'Paid' },
];

export default function Browse() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPricing, setSelectedPricing] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter resources
  const filteredResources = useMemo(() => {
    return MOCK_RESOURCES.filter((resource) => {
      const categoryMatch = selectedCategory === 'All' || resource.category === selectedCategory;
      const pricingMatch = selectedPricing === 'all' || resource.pricing === selectedPricing;
      const searchMatch =
        searchQuery === '' ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && pricingMatch && searchMatch;
    });
  }, [selectedCategory, selectedPricing, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredResources.length / ITEMS_PER_PAGE);
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-8">
          <h1 className="text-4xl font-bold mb-2">Browse Resources</h1>
          <p className="text-gray-600">Discover thousands of tools and resources</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20">
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Search</label>
                <Input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">Categories</label>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.name
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <span className="text-xs text-gray-500">{category.count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-sm font-semibold mb-3">Pricing Model</label>
                <div className="space-y-2">
                  {PRICING_MODELS.map((model) => (
                    <button
                      key={model.value}
                      onClick={() => {
                        setSelectedPricing(model.value);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedPricing === model.value
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">
                Showing {paginatedResources.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredResources.length)} of {filteredResources.length}{' '}
                resources
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Resources Grid/List */}
            {paginatedResources.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid md:grid-cols-2 gap-6 mb-8'
                    : 'space-y-4 mb-8'
                }
              >
                {paginatedResources.map((resource) => (
                  <Card
                    key={resource.id}
                    className={`cursor-pointer hover:shadow-lg transition-all ${
                      viewMode === 'list' ? 'p-4' : 'p-6'
                    }`}
                    onClick={() => setLocation(`/resource/${resource.slug}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{resource.title}</h3>
                        <p className="text-sm text-gray-500">{resource.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-yellow-500">★</span>
                          <span className="text-sm font-semibold">{resource.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">{resource.votes} votes</p>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{resource.description}</p>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 flex-wrap">
                        {resource.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {resource.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{resource.tags.length - 2}</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-600 capitalize">
                        {resource.pricing}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No resources found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
