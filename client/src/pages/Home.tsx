import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Search, Sparkles, Zap, Users } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: resources } = trpc.resources.list.useQuery({ limit: 6 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-background via-background to-secondary/20 py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <span className="text-sm font-medium text-accent">✨ Discover the Resource Intelligence Hub</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-balance">
              Find, Organize & Connect Digital Resources
            </h1>

            <p className="text-xl text-gray-900/70 mb-8 text-balance">
              Explore a curated knowledge graph of tools, services, and resources. Discover alternatives, integrations, and relationships that matter.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-12">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search resources, tools, or try 'Jira alternatives'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-elegant pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-900/40" />
              </div>
              <Button type="submit" size="lg">
                Search
              </Button>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse">
                <a>
                  <Button variant="outline" size="lg">
                    Browse Categories
                  </Button>
                </a>
              </Link>
              {isAuthenticated ? (
                <Link href="/submit">
                  <a>
                    <Button size="lg">Submit Resource</Button>
                  </a>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg">Sign In to Submit</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">Why NorthStar?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-elegant p-8">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">Intelligent Discovery</h3>
              <p className="text-gray-900/70">
                Find resources through an intelligent knowledge graph that understands relationships between tools.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-elegant p-8">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">Relationship-Aware</h3>
              <p className="text-gray-900/70">
                Discover alternatives, integrations, competitors, and ecosystem connections instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-elegant p-8">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">Community Driven</h3>
              <p className="text-gray-900/70">
                Contribute resources, create collections, and vote on relationships with the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="py-16 md:py-24 bg-subtle">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">Explore Categories</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link key={category.id} href={`/browse/${category.slug}`}>
                  <a className="card-elegant p-6 text-center hover:shadow-elegant-lg transition-all group">
                    {category.icon && <div className="text-3xl mb-2">{category.icon}</div>}
                    <h3 className="font-semibold group-hover:text-accent transition-colors">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-900/60 mt-1">{category.description}</p>
                    )}
                  </a>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/browse">
                <a>
                  <Button variant="outline">View All Categories</Button>
                </a>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Resources Section */}
      {resources && resources.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">Featured Resources</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <Link key={resource.id} href={`/resource/${resource.slug}`}>
                  <a className="card-elegant p-6 hover:shadow-elegant-lg transition-all group">
                    {resource.logo && (
                      <img
                        src={resource.logo}
                        alt={resource.title}
                        className="w-12 h-12 rounded-lg mb-4 object-cover"
                      />
                    )}
                    <h3 className="font-semibold text-lg group-hover:text-accent transition-colors mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-900/70 mb-4 line-clamp-2">{resource.description}</p>
                    <div className="flex items-center gap-2">
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

            <div className="text-center mt-8">
              <Link href="/browse">
                <a>
                  <Button variant="outline">Browse All Resources</Button>
                </a>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Ready to Contribute?</h2>
          <p className="text-lg mb-8 opacity-90">
            Help build the most comprehensive resource intelligence platform. Submit resources and shape the knowledge graph.
          </p>
          {isAuthenticated ? (
            <Link href="/submit">
              <a>
                <Button size="lg" variant="secondary">
                  Submit a Resource
                </Button>
              </a>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary">
                Sign In to Contribute
              </Button>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
