import { useState, useCallback } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { HorizontalNav } from "@/components/home/HorizontalNav";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AIChatBox } from "@/components/AIChatBox";
import { Helmet } from "react-helmet";
import { EnhancedAIGreeting } from "@/components/home/EnhancedAIGreeting";
import { StatusHearts } from "@/components/home/StatusHearts";
import { EnhancedMotivation } from "@/components/home/EnhancedMotivation";
import { PostCreator } from "@/components/home/PostCreator";
import { SocialFeed } from "@/components/home/SocialFeed";
import { TrendingVideos } from "@/components/home/TrendingVideos";
import { InnovationHome } from "@/components/home/InnovationHome";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <>
      <Helmet>
        <title>Smart World Connect - Think. Connect. Create.</title>
        <meta name="description" content="Smart World Connect — your global hub for innovation, research collaboration, and knowledge sharing. Share ideas, build projects, and connect with innovators." />
        <meta property="og:title" content="Smart World Connect - Think. Connect. Create." />
        <meta property="og:description" content="Your global hub for innovation, research collaboration, and knowledge sharing." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Smart World Connect" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.origin : ''} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 pb-24 pt-[110px] md:pt-[120px]">
        <Navbar />
        <HorizontalNav />

        <main className="container mx-auto px-4 lg:px-6">
          {/* Three-column layout for desktop */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 pt-4">
            
            {/* Left Sidebar - Innovation Hub (Desktop Only) */}
            <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-[140px] self-start">
              <InnovationHome />
            </aside>

            {/* Main Feed - Center Column */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              
              {/* AI Greeting Section */}
              <section className="animate-fade-in">
                <EnhancedAIGreeting onCreatePost={handlePostCreated} />
              </section>

              {/* Status Hearts */}
              <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <StatusHearts />
              </section>

              {/* Daily Motivation */}
              <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <EnhancedMotivation />
              </section>

              {/* Post Creator */}
              <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <PostCreator onPostCreated={handlePostCreated} />
              </section>

              {/* Trending Videos - Mobile/Tablet */}
              <section className="lg:hidden animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <TrendingVideos />
              </section>

              {/* Social Feed */}
              <section className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
                <SocialFeed refreshTrigger={refreshTrigger} />
              </section>

            </div>

            {/* Right Sidebar - Desktop Only */}
            <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-[140px] self-start">
              <TrendingVideos />
              
              {/* Footer on desktop */}
              <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <a href="/about" className="hover:text-primary transition-colors">About</a>
                  <a href="/contact" className="hover:text-primary transition-colors">Help</a>
                  <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
                  <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
                </div>
                <p>© 2026 Smart World Connect</p>
                <p className="text-primary font-medium">Think. Connect. Create.</p>
              </div>
            </aside>

          </div>

          {/* Mobile Footer */}
          <footer className="lg:hidden mt-8 pt-6 pb-4 border-t border-border">
            <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <a href="/about" className="hover:text-primary transition-colors">About</a>
                <a href="/contact" className="hover:text-primary transition-colors">Help</a>
                <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
                <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
              </div>
              <p className="text-center">
                © 2026 Smart World Connect. 
                <span className="text-primary font-medium ml-1">Think. Connect. Create.</span>
              </p>
            </div>
          </footer>
        </main>

        <InstallPrompt />
        <AIChatBox />
        <DashboardFloatingButton />
        <BottomNav />
      </div>
    </>
  );
}
