import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppLayout } from "./components/AppLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const Browse = lazy(() => import("./pages/Browse"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const Search = lazy(() => import("./pages/Search"));
const Submit = lazy(() => import("./pages/Submit"));
const Profile = lazy(() => import("./pages/Profile"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminBulk = lazy(() => import("./pages/AdminBulk"));
const AdminEditSuggestions = lazy(() => import("./pages/AdminEditSuggestions"));
const GraphExplorer = lazy(() => import("./pages/GraphExplorer"));
const AdminAIDrafts = lazy(() => import("./pages/AdminAIDrafts"));
const AdminArchiveImports = lazy(() => import("./pages/AdminArchiveImports"));
const AdminArchiveGovernance = lazy(() => import("./pages/AdminArchiveGovernance"));
const AdminArchiveBulkReview = lazy(() => import("./pages/AdminArchiveBulkReview"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Trending = lazy(() => import("./pages/Trending"));
const About = lazy(() => import("./pages/About"));
const Developer = lazy(() => import("./pages/Developer"));
const Settings = lazy(() => import("./pages/Settings"));
const SearchQuality = lazy(() => import("./pages/SearchQuality"));

function RouteLoading() {
  return (
    <div className="container flex min-h-[42vh] items-center justify-center py-10" role="status" aria-live="polite">
      <div className="ns-surface flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
        Loading workspace
      </div>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Suspense fallback={<RouteLoading />}>
        <Switch>
        {/* Public pages */}
        <Route path={"/"} component={Home} />
        <Route path={"/welcome"} component={Welcome} />
        <Route path={"/browse"} component={Browse} />
        <Route path={"/browse/:categorySlug"} component={Browse} />
        <Route path={"/resource/:slug"} component={ResourceDetail} />
        <Route path={"/graph"} component={GraphExplorer} />
        <Route path={"/graph/:slug"} component={GraphExplorer} />
        <Route path={"/search"} component={Search} />
        <Route path={"/trending"} component={Trending} />
        <Route path={"/about"} component={About} />
        <Route path={"/developer"} component={Developer} />

        {/* User pages */}
        <Route path={"/submit"} component={Submit} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/profile/:userId"} component={Profile} />
        <Route path={"/collections"} component={Collections} />
        <Route path={"/collection/:id"} component={CollectionDetail} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/admin/search-quality"} component={SearchQuality} />

        {/* Admin pages */}
        <Route path={"/admin"} component={Admin} />
        <Route path={"/admin/users"} component={AdminUsers} />
        <Route path={"/admin/reports"} component={AdminReports} />
        <Route path={"/admin/bulk"} component={AdminBulk} />
        <Route path={"/admin/edit-suggestions"} component={AdminEditSuggestions} />
        <Route path={"/admin/ai-drafts"} component={AdminAIDrafts} />
        <Route path={"/admin/archive-imports"} component={AdminArchiveImports} />
        <Route path={"/admin/archive-governance"} component={AdminArchiveGovernance} />
        <Route path={"/admin/archive-bulk-review"} component={AdminArchiveBulkReview} />

        {/* 404 */}
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LanguageProvider><TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider></LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
