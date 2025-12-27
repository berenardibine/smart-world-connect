import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { SmartAdsCarousel } from "@/components/SmartAdsCarousel";
import { TrendingProducts } from "@/components/TrendingProducts";
import { RecommendedProductsSection } from "@/components/RecommendedProductsSection";
import { CategoryTabs } from "@/components/CategoryTabs";
import { HomeProductGrid } from "@/components/HomeProductGrid";
import { LocationFilter } from "@/components/LocationFilter";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AIGreeting } from "@/components/home/AIGreeting";
import { QuickCategories } from "@/components/home/QuickCategories";
import { SmartChallenges } from "@/components/home/SmartChallenges";
import { MotivationBanner } from "@/components/home/MotivationBanner";
import { SmartAcademy } from "@/components/home/SmartAcademy";
import { AIChatBox } from "@/components/AIChatBox";
import { Helmet } from "react-helmet";
import { supabase } from "@/lib/supaseClient";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [provinceId, setProvinceId] = useState<string>("");
  const [districtId, setDistrictId] = useState<string>("");
  const [sectorId, setSectorId] = useState<string>("");

  // Load user's saved location on mount
  useEffect(() => {
    const loadUserLocation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("province_id, district_id, sector_id")
          .eq("id", session.user.id)
          .maybeSingle();
        
        if (profile) {
          if (profile.province_id) setProvinceId(profile.province_id);
          if (profile.district_id) setDistrictId(profile.district_id);
          if (profile.sector_id) setSectorId(profile.sector_id);
        }
      }
    };
    loadUserLocation();
  }, []);

  const handleLocationApply = (pId: string, dId: string, sId: string) => {
    setProvinceId(pId);
    setDistrictId(dId);
    setSectorId(sId);
  };

  const handleLocationClear = () => {
    setProvinceId("");
    setDistrictId("");
    setSectorId("");
  };

  return (
    <>
      <Helmet>
        <title>Smart Market - Shop Smart. Live Smart.</title>
        <meta name="description" content="Smart Market — your trusted online marketplace for shopping, marketing, and business in Rwanda. Find the best deals from local sellers." />
        <meta property="og:title" content="Smart Market - Shop Smart. Live Smart." />
        <meta property="og:description" content="Your trusted online marketplace for shopping, marketing, and business." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Smart Market" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.origin : ''} />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <Navbar />

        <main className="pt-[120px] md:pt-20 space-y-8 sm:space-y-12">
          {/* AI Greeting Section */}
          <section className="container mx-auto px-4 lg:px-6">
            <AIGreeting />
          </section>

          {/* Hero Smart Ads */}
          <section className="container mx-auto px-4 lg:px-6">
            <SmartAdsCarousel />
          </section>

          {/* Quick Categories */}
          <section className="container mx-auto px-4 lg:px-6">
            <QuickCategories />
          </section>

          {/* Recommended Products - Personalized */}
          <section className="container mx-auto px-4 lg:px-6">
            <RecommendedProductsSection />
          </section>
          
          {/* Trending Products - Horizontal Scroll */}
          <section>
            <TrendingProducts />
          </section>

          {/* Smart Challenges & Rewards */}
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
          
          {/* Browse All Products Section */}
          <section className="container mx-auto px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="section-header">Browse Products</h2>
                <p className="section-subheader">Discover amazing deals from verified sellers</p>
              </div>
              <LocationFilter
                provinceId={provinceId}
                districtId={districtId}
                sectorId={sectorId}
                onApply={handleLocationApply}
                onClear={handleLocationClear}
              />
            </div>
            
            {/* Category Filter */}
            <div className="mb-6">
              <CategoryTabs 
                activeCategory={activeCategory} 
                onCategoryChange={setActiveCategory} 
              />
            </div>
            
            {/* Product Grid with Infinite Scroll */}
            <HomeProductGrid 
              category={activeCategory === "All" ? undefined : activeCategory}
              limit={12}
              provinceId={provinceId}
              districtId={districtId}
              sectorId={sectorId}
            />
          </section>

          {/* Footer */}
          <footer className="container mx-auto px-4 lg:px-6 pt-8 pb-4 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <a href="/about" className="hover:text-foreground transition-colors">About</a>
                <a href="/contact" className="hover:text-foreground transition-colors">Help</a>
                <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
                <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              </div>
              <p>© 2024 Smart Market. Shop Smart. Live Smart.</p>
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
