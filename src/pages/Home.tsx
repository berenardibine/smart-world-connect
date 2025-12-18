import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { SmartAdsCarousel } from "@/components/SmartAdsCarousel";
import { TrendingProducts } from "@/components/TrendingProducts";
import { RecommendedProductsSection } from "@/components/RecommendedProductsSection";
import { CategoryTabs } from "@/components/CategoryTabs";
import { HomeProductGrid } from "@/components/HomeProductGrid";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container mx-auto px-3 pt-20 pb-6">
        {/* Recommended Products - Personalized */}
        <RecommendedProductsSection />
        
        {/* Trending Products - Horizontal Scroll */}
        <TrendingProducts />
        
        {/* Smart Ads Carousel */}
        <SmartAdsCarousel />
        
        {/* Category Tabs */}
        <div className="mt-6 mb-4">
          <h2 className="text-lg font-bold mb-3">Browse Products</h2>
          <CategoryTabs 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </div>
        
        {/* Compact Product Grid */}
        <HomeProductGrid 
          category={activeCategory === "All" ? undefined : activeCategory}
          limit={12}
          showLoadMore={true}
        />
      </main>

      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
}
