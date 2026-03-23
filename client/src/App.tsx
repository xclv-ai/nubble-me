import { Switch, Route, Redirect } from "wouter";
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
import ReadDocPage from "@/pages/read-doc";
import FeedPage from "@/pages/feed";
import ReadFeedPage from "@/pages/read-feed";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ai-branding" component={Home} />
      <Route path="/ai-ecommerce" component={Home} />
      <Route path="/a16z-portfolio" component={Home} />
      <Route path="/ai-digest">{() => <Redirect to="/" />}</Route>
      <Route path="/digest">{() => <Redirect to="/" />}</Route>
      <Route path="/v2" component={HomeV2} />
      <Route path="/v3" component={HomeV3} />
      <Route path="/v4" component={HomeV4} />
      <Route path="/import" component={ImportPage} />
      <Route path="/read/:id" component={ReadPage} />
      <Route path="/read-doc/:id" component={ReadDocPage} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/read-feed/:id" component={ReadFeedPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
