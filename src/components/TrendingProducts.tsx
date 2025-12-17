import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supaseClient";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  views: number;
  impressions: number;
  likes: number;
  is_negotiable: boolean;
  discount: number;
  discount_expiry: string | null;
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

  const fetchTrendingProducts = async () => {
    // Get products with highest views and impressions
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
      .order("views", { ascending: false })
      .limit(12);

    if (!error && data) {
      // Sort by combined score of views + impressions + likes
      const sorted = data.sort((a, b) => {
        const scoreA = (a.views || 0) + (a.impressions || 0) * 2 + (a.likes || 0) * 3;
        const scoreB = (b.views || 0) + (b.impressions || 0) * 2 + (b.likes || 0) * 3;
        return scoreB - scoreA;
      });
      setProducts(sorted);
    }
    setLoading(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold">Trending Now</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[200px]">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-4 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mb-8 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold">Trending Now</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => scroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[180px] md:min-w-[220px] flex-shrink-0">
            <ProductCard
              id={product.id}
              title={product.title}
              price={product.price}
              images={product.images || []}
              location={product.location}
              sellerName={product.profiles?.business_name || product.profiles?.full_name || "Seller"}
              likes={product.likes}
              isLiked={likedProducts.has(product.id)}
              isNegotiable={product.is_negotiable}
              contactWhatsapp={product.contact_whatsapp}
              contactCall={product.contact_call}
              views={product.views || 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
