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
import FoundersLandingV7 from "@/pages/founders-v7";
import FoundersLandingV8 from "@/pages/founders-v8";
import FoundersLandingV9 from "@/pages/founders-v9";
import FoundersLandingV10 from "@/pages/founders-v10";
import FoundersLandingV11 from "@/pages/founders-v11";
import FoundersLandingV12 from "@/pages/founders-v12";
import FoundersLandingV13 from "@/pages/founders-v13";
import FoundersLandingV14 from "@/pages/founders-v14";
import FoundersLandingV15 from "@/pages/founders-v15";
import FoundersLandingV16 from "@/pages/founders-v16";
import FoundersLandingV17 from "@/pages/founders-v17";
import FoundersLandingV18 from "@/pages/founders-v18";
import FoundersLandingV19 from "@/pages/founders-v19";
import FoundersLandingV20 from "@/pages/founders-v20";
import FoundersLandingV21 from "@/pages/founders-v21";

function AppRouter() {
  return (
    <Switch>
      {/* nubble.me is the founders page (owner, 2 Nov 2026); the news reader moved to /ai-news */}
      <Route path="/">{() => <FoundersLandingV21 rectLogo />}</Route>
      <Route path="/ai-news" component={Home} />
      <Route path="/founders" component={FoundersLanding} />
      <Route path="/founders-v2" component={FoundersLandingV2} />
      <Route path="/founders-v3">{() => <FoundersLandingV3 />}</Route>
      <Route path="/founders-v4" component={FoundersLandingV4} />
      <Route path="/founders-v5" component={FoundersLandingV5} />
      <Route path="/founders-v6" component={FoundersLandingV6} />
      <Route path="/founders-v7" component={FoundersLandingV7} />
      <Route path="/founders-v8" component={FoundersLandingV8} />
      <Route path="/founders-v9" component={FoundersLandingV9} />
      <Route path="/founders-v10" component={FoundersLandingV10} />
      <Route path="/founders-v11" component={FoundersLandingV11} />
      <Route path="/founders-v12" component={FoundersLandingV12} />
      <Route path="/founders-v13" component={FoundersLandingV13} />
      <Route path="/founders-v14">{() => <FoundersLandingV14 />}</Route>
      <Route path="/founders-v15">{() => <FoundersLandingV15 />}</Route>
      <Route path="/founders-v16">{() => <FoundersLandingV16 />}</Route>
      <Route path="/founders-v17">{() => <FoundersLandingV17 />}</Route>
      <Route path="/founders-v18">{() => <FoundersLandingV18 />}</Route>
      <Route path="/founders-v19">{() => <FoundersLandingV19 rectLogo />}</Route>
      <Route path="/founders-v20">{() => <FoundersLandingV20 rectLogo />}</Route>
      <Route path="/founders-v21">{() => <FoundersLandingV21 rectLogo />}</Route>
      <Route path="/ai-branding" component={Home} />
      <Route path="/ai-ecommerce" component={Home} />
      <Route path="/a16z-portfolio" component={Home} />
      <Route path="/pokpok" component={Home} />
      <Route path="/ai-digest">{() => <Redirect to="/ai-news" />}</Route>
      <Route path="/digest">{() => <Redirect to="/ai-news" />}</Route>
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
