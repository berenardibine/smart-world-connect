import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { HorizontalNav } from "@/components/home/HorizontalNav";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AIGreeting } from "@/components/home/AIGreeting";
import { SmartChallenges } from "@/components/home/SmartChallenges";
import { MotivationBanner } from "@/components/home/MotivationBanner";
import { SmartAcademy } from "@/components/home/SmartAcademy";
import { AIChatBox } from "@/components/AIChatBox";
import { RegionalHeader } from "@/components/RegionalHeader";
import { SocialFeed } from "@/components/feed/SocialFeed";
import { useRegion } from "@/contexts/RegionContext";
import { Helmet } from "react-helmet";

export default function Home() {
  const { currentLocation, getLocationTitle } = useRegion();

  return (
    <>
      <Helmet>
        <title>{getLocationTitle()} - Smart World Connect</title>
        <meta name="description" content={`${getLocationTitle()} — your trusted platform for community, challenges, and learning${currentLocation ? ` in ${currentLocation.name}` : ""}.`} />
        <meta property="og:title" content={`${getLocationTitle()} - Smart World Connect`} />
        <meta property="og:description" content="Connect. Share. Explore the Smart Way." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Smart World Connect" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.origin : ''} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 pb-24 pt-[60px] sm:pt-[70px]">
        <Navbar />
        <HorizontalNav />

        {/* Regional Header */}
        <div className="pt-14">
          <RegionalHeader />
        </div>

        <main className="space-y-6 pt-4">
          {/* AI Greeting Section */}
          <section className="container mx-auto px-4 lg:px-6">
            <AIGreeting />
          </section>

          {/* Social Feed */}
          <section className="container mx-auto px-4 lg:px-6">
            <SocialFeed />
          </section>

          {/* Smart Challenges */}
          <section className="container mx-auto px-4 lg:px-6">
            <SmartChallenges />
          </section>

          {/* Smart Academy */}
          <section className="container mx-auto px-4 lg:px-6">
            <SmartAcademy />
          </section>

          {/* Motivation Banner */}
          <section className="container mx-auto px-4 lg:px-6">
            <MotivationBanner />
          </section>

          {/* Footer */}
          <footer className="container mx-auto px-4 lg:px-6 pt-8 pb-4 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <a href="/about" className="hover:text-primary transition-colors">About</a>
                <a href="/contact" className="hover:text-primary transition-colors">Help</a>
                <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
                <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
              </div>
              <p className="flex items-center gap-1">
                © 2026 Smart World Connect. 
                <span className="text-primary font-medium">Connect. Learn. Grow.</span>
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