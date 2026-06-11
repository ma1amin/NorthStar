import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/AppLayout";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ResourceDetail from "./pages/ResourceDetail";
import Search from "./pages/Search";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import Collections from "./pages/Collections";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <AppLayout>
      <Switch>
        {/* Public pages */}
        <Route path={"/"} component={Home} />
        <Route path={"/browse"} component={Browse} />
        <Route path={"/browse/:categorySlug"} component={Browse} />
        <Route path={"/resource/:slug"} component={ResourceDetail} />
        <Route path={"/search"} component={Search} />

        {/* User pages */}
        <Route path={"/submit"} component={Submit} />
        <Route path={"/profile/:userId"} component={Profile} />
        <Route path={"/collections"} component={Collections} />

        {/* Admin pages */}
        <Route path={"/admin"} component={Admin} />

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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
