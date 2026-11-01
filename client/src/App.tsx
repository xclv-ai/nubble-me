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
import FoundersLanding from "@/pages/founders";
import FoundersLandingV2 from "@/pages/founders-v2";
import FoundersLandingV3 from "@/pages/founders-v3";
import FoundersLandingV4 from "@/pages/founders-v4";
import FoundersLandingV5 from "@/pages/founders-v5";
import FoundersLandingV6 from "@/pages/founders-v6";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/founders" component={FoundersLanding} />
      <Route path="/founders-v2" component={FoundersLandingV2} />
      <Route path="/founders-v3">{() => <FoundersLandingV3 />}</Route>
      <Route path="/founders-v4" component={FoundersLandingV4} />
      <Route path="/founders-v5" component={FoundersLandingV5} />
      <Route path="/founders-v6" component={FoundersLandingV6} />
      <Route path="/ai-branding" component={Home} />
      <Route path="/ai-ecommerce" component={Home} />
      <Route path="/a16z-portfolio" component={Home} />
      <Route path="/pokpok" component={Home} />
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
