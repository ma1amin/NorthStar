import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-gray-200 shadow-elegant">
        <div className="container h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-xl hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white text-sm font-bold">NS</span>
            </div>
            <span className="hidden sm:inline">NorthStar</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/browse" className="text-sm font-medium text-gray-900/80 hover:text-gray-900 transition-colors">
              Browse
            </Link>
            <Link href="/search" className="text-sm font-medium text-gray-900/80 hover:text-gray-900 transition-colors">
              Search
            </Link>
            <a
              href="#"
              className="text-sm font-medium text-gray-900/80 hover:text-gray-900 transition-colors"
            >
              Collections
            </a>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Search icon */}
            <Link href="/search" className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <Search className="w-5 h-5 text-gray-900/60" />
            </Link>

            {/* Auth buttons */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="hidden sm:inline text-sm">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`/profile/${user.id}`}>Profile</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/collections">Collections</a>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <a href="/admin">Admin</a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm">Sign In</Button>
              </a>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-card">
            <nav className="container py-4 flex flex-col gap-3">
              <Link href="/browse">
                <a className="text-sm font-medium text-gray-900/80 hover:text-gray-900 transition-colors py-2">
                  Browse
                </a>
              </Link>
              <Link href="/search">
                <a className="text-sm font-medium text-gray-900/80 hover:text-gray-900 transition-colors py-2">
                  Search
                </a>
              </Link>
              <a
                href="#"
                className="text-sm font-medium text-gray-900/80 hover:text-gray-900 transition-colors py-2"
              >
                Collections
              </a>
              {isAuthenticated && (
                <Link href="/submit">
                  <a className="text-sm font-medium text-accent hover:text-accent/80 transition-colors py-2">
                    Submit Resource
                  </a>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-gray-200 mt-16">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-white text-sm font-bold">NS</span>
                </div>
                <span className="font-serif font-bold">NorthStar</span>
              </div>
              <p className="text-sm text-gray-900/60">
                Discover, organize, and connect digital resources through an intelligent knowledge graph.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    Browse Resources
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    Submit Resource
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    Collections
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    Twitter
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-900/60 hover:text-gray-900 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-900/60">
            <p>&copy; 2026 NorthStar. All rights reserved.</p>
            <p>An open-source resource intelligence platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
