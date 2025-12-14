import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { AIRecommendedProducts } from "@/components/AIRecommendedProducts";
import { shuffleArray } from "@/lib/shuffleArray";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setCurrentUserId(session.user.id);
      
      // Fetch user's liked products
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
    let query = supabase
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

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Shuffle products randomly instead of sorting by time
      setProducts(shuffleArray(data));
    }
  };

  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        fetchProducts();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-6">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : null}
        
        {!loading && (
          products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products available yet
            </div>
          ) : (
            <>
              {currentUserId && <AIRecommendedProducts />}
              
              <h2 className="text-lg font-bold mt-8 mb-4">All Products</h2>
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
                  />
                ))}
              </div>
            </>
          )
        )}
      </main>

      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
}
