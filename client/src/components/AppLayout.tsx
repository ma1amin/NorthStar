import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Compass,
  Code2,
  GitBranch,
  FolderOpen,
  Flag,
  FilePenLine,
  Sparkles,
  ListChecks,
  Languages,
  LogOut,
  Menu,
  Moon,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  X,
  Sun,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { isNavigatorRouteActive } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, startLogin, logout } = useAuth();
  const { locale, toggleLocale, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const ignoreShortcutCharacter = useRef(false);
  const primaryNavigation = [
    { href: "/browse", label: t("explore"), icon: Compass },
    { href: "/search", label: t("search"), icon: Search },
    { href: "/trending", label: t("trending"), icon: TrendingUp },
    { href: "/collections", label: t("collections"), icon: FolderOpen },
    { href: "/graph", label: t("graph"), icon: GitBranch },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        ignoreShortcutCharacter.current = true;
        setCommandQuery("");
        setCommandOpen((open) => !open);
        window.setTimeout(() => { ignoreShortcutCharacter.current = false; }, 100);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = (href: string) => {
    setLocation(href);
    setMobileMenuOpen(false);
    setCommandOpen(false);
    setCommandQuery("");
  };

  return (
    <div className="ns-noise flex min-h-screen flex-col bg-[#f8fafc] text-slate-950">
      <a href="#main-content" className="sr-only z-[60] rounded-b-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-0">Skip to main content</a>
      <header className="ns-surface sticky top-0 z-50 border-x-0 border-t-0 bg-white/78">
        <div className="container flex h-[4.35rem] items-center justify-between gap-3">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 shadow-[0_6px_18px_rgba(37,99,235,0.28)] transition-transform duration-200 group-hover:scale-105">
              <Network className="h-5 w-5 text-white" strokeWidth={2.4} />
            </div>
            <div className="hidden sm:block">
              <span className="block font-['Sora'] text-base font-bold tracking-tight text-slate-950">NorthStar</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">Resource graph</span>
            </div>
          </Link>

          <nav aria-label="Primary" className="hidden items-center rounded-2xl border border-slate-200/80 bg-white/70 p-1 shadow-[0_6px_20px_rgba(15,23,42,0.04)] md:flex">
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${isNavigatorRouteActive(location, item.href) ? "bg-slate-950 text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"}`}>
                  <Icon className="h-3.5 w-3.5" />{item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="outline" onClick={() => setCommandOpen(true)} className="hidden h-9 rounded-xl border-slate-200/80 bg-white/75 px-2.5 text-slate-600 shadow-sm hover:border-sky-200 hover:bg-white sm:inline-flex">
              <Search className="mr-2 h-4 w-4" /><span className="hidden lg:inline">Search resources</span><span className="lg:hidden">Search</span><kbd className="ml-2 hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 xl:inline-flex">⌘ K</kbd>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:hidden" aria-label="Open command search" onClick={() => setCommandOpen(true)}><Search className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={toggleLocale} aria-label={locale === "en" ? "Switch to Arabic" : "Switch to English"}><Languages className="h-4 w-4" />{locale === "en" ? "ع" : "EN"}</Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100" onClick={toggleTheme} aria-label={theme === "light" ? t("switchToDark") : t("switchToLight")}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <PwaInstallButton />
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-xl px-1.5 pr-2.5 hover:bg-slate-100">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-slate-900 text-xs font-bold text-white">{user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name?.charAt(0).toUpperCase() || "U"}</div>
                    <span className="hidden max-w-24 truncate text-sm font-semibold text-slate-700 lg:inline">{user.name || "Account"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-200 p-1.5">
                  <div className="px-2 py-2"><p className="truncate text-sm font-semibold text-slate-900">{user.name || "NorthStar member"}</p><p className="mt-0.5 text-xs text-slate-500">{user.reputation ?? 0} reputation</p></div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}><UserRound className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/capture")}><Plus className="mr-2 h-4 w-4" />{t("captureResources")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}><Settings className="mr-2 h-4 w-4" />{t("settings")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/collections")}><FolderOpen className="mr-2 h-4 w-4" />Collections</DropdownMenuItem>
                  {(user.role === "admin" || user.role === "moderator") && <DropdownMenuItem onClick={() => navigate("/admin")}><Network className="mr-2 h-4 w-4" />Moderation</DropdownMenuItem>}
                  {(user.role === "admin" || user.role === "moderator") && <DropdownMenuItem onClick={() => navigate("/admin/contributors")}><ShieldCheck className="mr-2 h-4 w-4" />Contributor review</DropdownMenuItem>}
                  {(user.role === "admin" || user.role === "moderator") && <DropdownMenuItem onClick={() => navigate("/admin/search-quality")}><BarChart3 className="mr-2 h-4 w-4" />{t("searchQuality")}</DropdownMenuItem>}
                  {(user.role === "admin" || user.role === "moderator") && <DropdownMenuItem onClick={() => navigate("/admin/reports")}><Flag className="mr-2 h-4 w-4" />Report triage</DropdownMenuItem>}
                  {(user.role === "admin" || user.role === "moderator") && <DropdownMenuItem onClick={() => navigate("/admin/bulk")}><ListChecks className="mr-2 h-4 w-4" />Bulk rejection</DropdownMenuItem>}
                  {user.role === "admin" && <DropdownMenuItem onClick={() => navigate("/admin/edit-suggestions")}><FilePenLine className="mr-2 h-4 w-4" />Edit suggestions</DropdownMenuItem>}
                  {user.role === "admin" && <DropdownMenuItem onClick={() => navigate("/admin/ai-drafts")}><Sparkles className="mr-2 h-4 w-4" />AI review drafts</DropdownMenuItem>}
                  {user.role === "admin" && <DropdownMenuItem onClick={() => navigate("/admin/users")}><Users className="mr-2 h-4 w-4" />User management</DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-700"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : <Link href="/welcome"><Button size="sm" className="h-9 rounded-xl bg-slate-900 px-3.5 text-white shadow-sm hover:bg-slate-800">{t("signIn")}</Button></Link>}
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl md:hidden" aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button>
          </div>
        </div>

        {mobileMenuOpen && <div className="border-t border-slate-200/80 bg-white/95 shadow-[0_16px_30px_rgba(15,23,42,0.08)] md:hidden"><nav aria-label="Mobile navigation" className="container grid gap-1 py-3">{primaryNavigation.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${isNavigatorRouteActive(location, item.href) ? "bg-sky-50 text-sky-800" : "text-slate-600 hover:bg-slate-50"}`}><Icon className="h-4 w-4" />{item.label}</Link>; })}{isAuthenticated && <Link href="/submit" onClick={() => setMobileMenuOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Submit a resource</Link>}</nav></div>}
      </header>

      <CommandDialog open={commandOpen} onOpenChange={(open) => { setCommandOpen(open); if (!open) setCommandQuery(""); }} title="NorthStar command search" description="Navigate NorthStar and start resource discovery." className="max-w-lg rounded-2xl border-slate-200">
            <CommandInput value={commandQuery} onValueChange={(value) => { if (ignoreShortcutCharacter.current && value.toLowerCase() === "k") return; setCommandQuery(value); }} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandQuery(""); } }} placeholder={t("commandSearch")} />
        <CommandList className="max-h-[360px] p-1.5">
          <CommandEmpty>No matching actions.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {primaryNavigation.map((item) => { const Icon = item.icon; return <CommandItem key={item.href} value={item.label} onSelect={() => navigate(item.href)}><Icon className="h-4 w-4 text-sky-600" /><span>{item.label}</span>{item.href === "/search" && <CommandShortcut>⌘ K</CommandShortcut>}</CommandItem>; })}
          </CommandGroup>
          <CommandGroup heading="Learn">
            <CommandItem value={t("about")} onSelect={() => navigate("/about")}><Compass className="h-4 w-4 text-violet-600" /><span>{t("about")}</span></CommandItem>
            <CommandItem value={t("developer")} onSelect={() => navigate("/developer")}><Code2 className="h-4 w-4 text-violet-600" /><span>{t("developer")}</span></CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Contribute">
            <CommandItem value={t("captureResources")} onSelect={() => { if (isAuthenticated) navigate("/capture"); else startLogin(); }}><Upload className="h-4 w-4 text-violet-600" /><span>{t("captureResources")}</span></CommandItem>
            <CommandItem value="Submit a resource" onSelect={() => { if (isAuthenticated) navigate("/submit"); else startLogin(); }}><Plus className="h-4 w-4 text-violet-600" /><span>Submit a resource</span></CommandItem>
            {isAuthenticated && <CommandItem value="My profile" onSelect={() => navigate("/profile")}><UserRound className="h-4 w-4 text-violet-600" /><span>My profile</span></CommandItem>}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <main id="main-content" className="relative flex-1" tabIndex={-1}>{children}</main>

      <footer className="mt-16 border-t border-slate-200/80 bg-white/75">
        <div className="container py-10"><div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between"><div className="max-w-sm"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white"><Network className="h-4 w-4" /></div><span className="font-['Sora'] font-bold text-slate-950">NorthStar</span></div><p className="mt-3 text-sm leading-6 text-slate-500">An open resource intelligence platform for discovering tools, understanding context, and navigating the relationships between them.</p></div><div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm"><Link href="/browse" className="font-medium text-slate-600 hover:text-sky-700">Explore resources</Link><Link href="/search" className="font-medium text-slate-600 hover:text-sky-700">Relationship search</Link><Link href="/collections" className="font-medium text-slate-600 hover:text-sky-700">Collections</Link><Link href="/submit" className="font-medium text-slate-600 hover:text-sky-700">Submit a resource</Link></div></div><div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 NorthStar. Open resource intelligence.</span><span>Designed for discovery, context, and community verification.</span></div></div>
      </footer>
    </div>
  );
}
