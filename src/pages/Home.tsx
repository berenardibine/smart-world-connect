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
import { Sparkles, TrendingUp, ShoppingBag, Heart, Star, Zap } from "lucide-react";

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

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 pb-24">
        <Navbar />

        <main className="pt-[120px] md:pt-20 space-y-10 sm:space-y-14">
          {/* AI Greeting Section with Enhanced Design */}
          <section className="container mx-auto px-4 lg:px-6">
            <AIGreeting />
          </section>

          {/* Quick Stats Banner */}
          <section className="container mx-auto px-4 lg:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-card p-4 flex items-center gap-3 group hover:border-primary/40 transition-all">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="font-bold text-lg text-foreground">1000+</p>
                </div>
              </div>
              <div className="glass-card p-4 flex items-center gap-3 group hover:border-success/40 transition-all">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-success/20 to-success/5 group-hover:scale-110 transition-transform">
                  <Star className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sellers</p>
                  <p className="font-bold text-lg text-foreground">500+</p>
                </div>
              </div>
              <div className="glass-card p-4 flex items-center gap-3 group hover:border-info/40 transition-all">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-info/20 to-info/5 group-hover:scale-110 transition-transform">
                  <Heart className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Happy Buyers</p>
                  <p className="font-bold text-lg text-foreground">10K+</p>
                </div>
              </div>
              <div className="glass-card p-4 flex items-center gap-3 group hover:border-warning/40 transition-all">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Daily Deals</p>
                  <p className="font-bold text-lg text-foreground">50+</p>
                </div>
              </div>
            </div>
          </section>

          {/* Hero Smart Ads */}
          <section className="container mx-auto px-4 lg:px-6">
            <SmartAdsCarousel />
          </section>

          {/* Quick Categories with Icons */}
          <section className="container mx-auto px-4 lg:px-6">
            <QuickCategories />
          </section>

          {/* Recommended Products - Personalized */}
          <section className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="section-header">Recommended For You</h2>
            </div>
            <RecommendedProductsSection />
          </section>
          
          {/* Trending Products - Horizontal Scroll */}
          <section>
            <div className="container mx-auto px-4 lg:px-6 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-destructive" />
                <h2 className="section-header">Trending Now</h2>
                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold animate-pulse">
                  🔥 HOT
                </span>
              </div>
            </div>
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
                <h2 className="section-header flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  Browse Products
                </h2>
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
              limit={120000}
              provinceId={provinceId}
              districtId={districtId}
              sectorId={sectorId}
            />
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
                © 2025 Smart Market. 
                <span className="text-primary font-medium">Shop Smart. Live Smart.</span>
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
