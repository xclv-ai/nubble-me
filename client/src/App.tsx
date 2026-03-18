import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import HomeV2 from "@/pages/home-v2";
import HomeV3 from "@/pages/home-v3";
import HomeV4 from "@/pages/home-v4";
import ImportPage from "@/pages/import";
import ReadPage from "@/pages/read";
import FeedPage from "@/pages/feed";
import ReadFeedPage from "@/pages/read-feed";
import AiDigestPage from "@/pages/ai-digest";
import AiBrandingPage from "@/pages/ai-branding";
import AiEcommercePage from "@/pages/ai-ecommerce";
import A16zPortfolioPage from "@/pages/a16z-portfolio";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/v2" component={HomeV2} />
      <Route path="/v3" component={HomeV3} />
      <Route path="/v4" component={HomeV4} />
      <Route path="/import" component={ImportPage} />
      <Route path="/read/:id" component={ReadPage} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/read-feed/:id" component={ReadFeedPage} />
      <Route path="/ai-digest" component={AiDigestPage} />
      <Route path="/ai-branding" component={AiBrandingPage} />
      <Route path="/ai-ecommerce" component={AiEcommercePage} />
      <Route path="/a16z-portfolio" component={A16zPortfolioPage} />
      <Route path="/digest">{() => <Redirect to="/ai-digest" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
