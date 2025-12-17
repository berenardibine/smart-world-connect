import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { SmartAdsCarousel } from "@/components/SmartAdsCarousel";
import { TrendingProducts } from "@/components/TrendingProducts";
import { RecommendedProductsSection } from "@/components/RecommendedProductsSection";
import { CategorySection } from "@/components/CategorySection";
import { shuffleArray } from "@/lib/shuffleArray";

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Toys & Games",
  "Books",
  "Automotive",
  "Health & Beauty",
  "Food & Beverages",
  "Other"
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchProducts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setCurrentUserId(session.user.id);
      
      const { data: likes } = await supabase
        .from("product_likes")
        .select("product_id")
        .eq("user_id", session.user.id);
      
      if (likes) {
        setLikedProducts(new Set(likes.map(l => l.product_id)));
      }
    }

    await fetchProducts();
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (
          full_name,
          business_name
        )
      `)
      .eq("status", "approved")
      .not("category", "in", '("Agriculture Product","Equipment for Lent")');

    if (!error && data) {
      setProducts(shuffleArray(data));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-6">
        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Recommended Products */}
            <RecommendedProductsSection />
            
            {/* Trending Products */}
            <TrendingProducts />
            
            {/* Smart Ads */}
            <SmartAdsCarousel />
            
            {/* Category Sections */}
            {CATEGORIES.map(category => (
              <CategorySection 
                key={category} 
                category={category} 
                likedProducts={likedProducts}
              />
            ))}
            
            {/* All Products */}
            <h2 className="text-lg font-bold mt-8 mb-4">All Products</h2>
            {products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No products available yet
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    images={product.images || []}
                    video={product.video_url}
                    location={product.location}
                    sellerName={product.profiles?.business_name || product.profiles?.full_name || "Seller"}
                    likes={product.likes}
                    isLiked={likedProducts.has(product.id)}
                    isNegotiable={product.is_negotiable}
                    rentalRateType={product.rental_rate_type}
                    contactWhatsapp={product.contact_whatsapp}
                    contactCall={product.contact_call}
                    views={product.views || 0}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
}
