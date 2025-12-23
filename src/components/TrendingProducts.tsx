import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supaseClient";
import { CompactProductCard } from "@/components/CompactProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdminPostedProduct } from "@/lib/seoUrls";
import { shuffleArray } from "@/lib/shuffleArray";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  views: number;
  impressions: number;
  likes: number;
  is_negotiable: boolean;
  rental_rate_type?: string;
  contact_whatsapp: string;
  contact_call: string;
  profiles: {
    full_name: string;
    business_name: string | null;
  };
}

export function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [productStats, setProductStats] = useState<Record<string, { rating: number; commentCount: number }>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrendingProducts();
    fetchUserLikes();
  }, []);

  const fetchUserLikes = async () => {
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
      
      setProductStats(stats);
    }
  };

  const fetchTrendingProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (full_name, business_name)
      `)
      .eq("status", "approved")
      .order("views", { ascending: false })
      .limit(12);

    if (!error && data) {
      // Shuffle products randomly for fresh experience each visit
      const shuffled = shuffleArray(data);
      setProducts(shuffled);
      await fetchProductStats(shuffled.map(p => p.id));
    }
    setLoading(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold">Trending Now</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[150px]">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mb-6 relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold">Trending Now</h2>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const isAdmin = isAdminPostedProduct({
            contact_whatsapp: product.contact_whatsapp,
            contact_call: product.contact_call
          });
          const stats = productStats[product.id] || { rating: 0, commentCount: 0 };
          
          return (
            <div key={product.id} className="min-w-[150px] w-[150px] md:min-w-[180px] md:w-[180px] flex-shrink-0">
              <CompactProductCard
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
