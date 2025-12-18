import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { CompactProductCard } from "@/components/CompactProductCard";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { shuffleArray } from "@/lib/shuffleArray";
import { isAdminPostedProduct } from "@/lib/seoUrls";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  likes: number;
  views: number;
  is_negotiable: boolean;
  contact_whatsapp: string;
  contact_call: string;
  rental_rate_type?: string;
  profiles: {
    full_name: string;
    business_name: string | null;
  };
}

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [productStats, setProductStats] = useState<Record<string, { rating: number; commentCount: number }>>({});
  const [hasMore, setHasMore] = useState(true);

  const categoryName = categorySlug
    ?.split('-')
    .map(word => word === 'and' ? '&' : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || '';

  useEffect(() => {
    fetchProducts();
    checkLikes();
  }, [categorySlug]);

  const checkLikes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: likes } = await supabase
        .from("product_likes")
        .select("product_id")
        .eq("user_id", session.user.id);
      
      if (likes) {
        setLikedProducts(new Set(likes.map(l => l.product_id)));
      }
    }
  };

  const fetchProductStats = async (productIds: string[]) => {
    const { data: comments } = await supabase
      .from("comments")
      .select("product_id, rating")
      .in("product_id", productIds);

    if (comments) {
      const stats: Record<string, { rating: number; commentCount: number }> = {};
      
      productIds.forEach(id => {
        const productComments = comments.filter(c => c.product_id === id);
        const avgRating = productComments.length > 0
          ? productComments.reduce((sum, c) => sum + (c.rating || 0), 0) / productComments.length
          : 0;
        stats[id] = { rating: avgRating, commentCount: productComments.length };
      });
      
      setProductStats(prev => ({ ...prev, ...stats }));
    }
  };

  const fetchProducts = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (full_name, business_name)
      `)
      .eq("status", "approved")
      .eq("category", categoryName)
      .order("views", { ascending: false })
      .range(offset, offset + 11);

    if (!error && data) {
      if (offset === 0) {
        setProducts(shuffleArray(data));
      } else {
        setProducts(prev => [...prev, ...shuffleArray(data)]);
      }
      setHasMore(data.length === 12);
      await fetchProductStats(data.map(p => p.id));
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = () => fetchProducts(products.length);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container mx-auto px-3 pt-20 pb-6">
        <h1 className="text-xl font-bold mb-4">{categoryName}</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No products found in this category
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => {
                const isAdmin = isAdminPostedProduct({
                  contact_whatsapp: product.contact_whatsapp,
                  contact_call: product.contact_call
                });
                const stats = productStats[product.id] || { rating: 0, commentCount: 0 };
                
                return (
                  <CompactProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    images={product.images || []}
                    isNegotiable={product.is_negotiable}
                    rentalRateType={product.rental_rate_type}
                    views={product.views || 0}
                    rating={stats.rating}
                    commentCount={stats.commentCount}
                    likes={product.likes || 0}
                    isLiked={likedProducts.has(product.id)}
                    sellerName={product.profiles?.business_name || product.profiles?.full_name}
                    isAdminProduct={isAdmin}
                  />
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
