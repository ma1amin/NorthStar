import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppLayout } from "./components/AppLayout";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ResourceDetail from "./pages/ResourceDetail";
import Search from "./pages/Search";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import AdminBulk from "./pages/AdminBulk";
import AdminEditSuggestions from "./pages/AdminEditSuggestions";
import GraphExplorer from "./pages/GraphExplorer";
import AdminAIDrafts from "./pages/AdminAIDrafts";
import AdminArchiveImports from "./pages/AdminArchiveImports";
import AdminArchiveGovernance from "./pages/AdminArchiveGovernance";
import AdminArchiveBulkReview from "./pages/AdminArchiveBulkReview";
import Welcome from "./pages/Welcome";
import Trending from "./pages/Trending";
import About from "./pages/About";
import Developer from "./pages/Developer";
import Settings from "./pages/Settings";
import SearchQuality from "./pages/SearchQuality";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <AppLayout>
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
