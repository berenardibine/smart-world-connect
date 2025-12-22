import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { SmartAdsCarousel } from "@/components/SmartAdsCarousel";
import { TrendingProducts } from "@/components/TrendingProducts";
import { RecommendedProductsSection } from "@/components/RecommendedProductsSection";
import { CategoryTabs } from "@/components/CategoryTabs";
import { HomeProductGrid } from "@/components/HomeProductGrid";
import { Helmet } from "react-helmet";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <>
      <Helmet>
        <title>Rwanda Smart Market - Buy & Sell Products Online</title>
        <meta name="description" content="Rwanda's premier online marketplace. Buy and sell electronics, fashion, agriculture products, and more. Join thousands of buyers and sellers today." />
        <meta property="og:title" content="Rwanda Smart Market - Buy & Sell Products Online" />
        <meta property="og:description" content="Rwanda's premier online marketplace. Buy and sell products easily." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.origin : ''} />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <Navbar />

        <main className="pt-[120px] sm:pt-20">
          {/* Hero Smart Ads */}
          <section className="container mx-auto px-3 sm:px-4 lg:px-6">
            <SmartAdsCarousel />
          </section>

          {/* Recommended Products - Personalized */}
          <section className="container mx-auto px-3 sm:px-4 lg:px-6 mt-6">
            <RecommendedProductsSection />
          </section>
          
          {/* Trending Products - Horizontal Scroll */}
          <section className="mt-8">
            <TrendingProducts />
          </section>
          
          {/* Browse All Products Section */}
          <section className="container mx-auto px-3 sm:px-4 lg:px-6 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Browse Products</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Discover amazing deals from verified sellers</p>
              </div>
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
            />
          </section>
        </main>

        <DashboardFloatingButton />
        <BottomNav />
      </div>
    </>
  );
}