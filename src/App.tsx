import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { OrbBackground } from "@/components/OrbBackground";
import { trackPageview, startHeartbeat } from "@/lib/analytics";

const Index = lazy(() => import("./pages/Index"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AnalyticsTracker = () => {
  const location = useLocation();
  useEffect(() => {
    const p = location.pathname;
    const isAdmin = p.startsWith('/admin');
    const isPublic = p === '/' || p.startsWith('/gallery') || p.startsWith('/blog');
    if (!isAdmin && isPublic) {
      trackPageview(p + location.search);
    }
  }, [location.pathname, location.search]);
  useEffect(() => {
    startHeartbeat();
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="min-h-screen bg-background relative overflow-visible">
        <BrowserRouter>
          <AnalyticsTracker />
          <OrbBackground />
          <div className="relative z-[10]">
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/gallery/:year/:galleryName" element={<Gallery />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/admin" element={<Admin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
