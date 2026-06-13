import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Network, Users, ArrowRight, Github, Zap } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { getLoginUrl } from '@/const';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Main Headline */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200 mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">Discover the Resource Intelligence Hub</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              Find, Organize &<br />
              <span className="text-gradient">Connect Digital Resources</span>
            </h1>
            
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Explore a curated knowledge graph of tools, services, and resources. Discover alternatives, integrations, and relationships that matter.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16 animate-slide-in-right">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Search resources, tools, or try 'Jira alternatives'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-6 pr-16 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <Button
                onClick={() => setLocation('/browse')}
                className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
              >
                Browse Categories
              </Button>
              {!isAuthenticated ? (
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign In to Submit
                </Button>
              ) : (
                <Button
                  onClick={() => setLocation('/submit')}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Submit Resource
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why NorthStar?</h2>
            <p className="text-xl text-neutral-600">Everything you need to discover and organize digital resources</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Intelligent Discovery</h3>
              <p className="text-neutral-600">
                Find resources through an intelligent knowledge graph that understands relationships between tools.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Network className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Relationship-Aware</h3>
              <p className="text-neutral-600">
                Discover alternatives, integrations, competitors, and ecosystem connections instantly.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 hover:shadow-lg transition-all duration-300 border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
              <p className="text-neutral-600">
                Contribute resources, create collections, and vote on relationships with the community.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-neutral-600">Simple steps to discover and organize resources</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Search', description: 'Find resources by name, category, or relationship' },
              { step: 2, title: 'Explore', description: 'Discover alternatives and related tools' },
              { step: 3, title: 'Organize', description: 'Create collections and bookmark favorites' },
              { step: 4, title: 'Contribute', description: 'Submit new resources and relationships' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Explore?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers and teams discovering the best tools and resources.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => setLocation('/browse')}
              className="bg-white text-blue-600 hover:bg-neutral-100 font-semibold px-8 py-3"
            >
              Browse Resources
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {!isAuthenticated && (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3"
              >
                <Github className="w-4 h-4 mr-2" />
                Sign In with GitHub
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Resources', value: '5000+' },
              { label: 'Relationships', value: '10000+' },
              { label: 'Categories', value: '50+' },
              { label: 'Community Members', value: '1000+' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-neutral-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
