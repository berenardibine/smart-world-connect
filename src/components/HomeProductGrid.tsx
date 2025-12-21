import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supaseClient";
import { CompactProductCard } from "./CompactProductCard";
import { InlineSellerAds } from "./InlineSellerAds";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { isAdminPostedProduct } from "@/lib/seoUrls";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  is_negotiable?: boolean;
  rental_rate_type?: string;
  views?: number;
  likes?: number;
  contact_whatsapp?: string;
  contact_call?: string;
  discount?: number;
  profiles?: {
    full_name?: string;
    business_name?: string;
  };
}

interface HomeProductGridProps {
  category?: string;
  limit?: number;
  showLoadMore?: boolean;
}

export const HomeProductGrid = ({ 
  category, 
  limit = 12,
  showLoadMore = true 
}: HomeProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [productStats, setProductStats] = useState<Record<string, { rating: number; commentCount: number }>>({});

  const fetchProducts = useCallback(async (offset = 0) => {
    const query = supabase
      .from("products")
      .select(`
        id, title, price, images, is_negotiable, rental_rate_type, views, likes, discount,
        contact_whatsapp, contact_call,
        profiles:seller_id (full_name, business_name)
      `)
      .eq("status", "approved")
      .not("category", "in", '("Agriculture Product","Equipment for Lent")')
      .order("views", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "All") {
      query.eq("category", category);
    }

    const { data, error } = await query;

    if (!error && data) {
      if (offset === 0) {
        setProducts(data);
      } else {
        setProducts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === limit);
      
      // Fetch stats for these products
      await fetchProductStats(data.map(p => p.id));
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [category, limit]);

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
        stats[id] = {
          rating: avgRating,
          commentCount: productComments.length
        };
      });
      
      setProductStats(prev => ({ ...prev, ...stats }));
    }
  };

  const fetchUserLikes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("product_likes")
        .select("product_id")
        .eq("user_id", session.user.id);
      
      if (data) {
        setLikedProducts(new Set(data.map(l => l.product_id)));
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    setProducts([]);
    fetchProducts(0);
    fetchUserLikes();
  }, [category, fetchProducts]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts(0);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  // Subscribe to realtime product updates
  useEffect(() => {
    const channel = supabase
      .channel('home-products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          // Refresh on any product change
          fetchProducts(0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchProducts(products.length);
  };

  const refresh = async () => {
    setLoading(true);
    await fetchProducts(0);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
        <Button variant="outline" onClick={refresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inline Seller Ads - appears at top */}
      <InlineSellerAds />
      
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
              discount={product.discount || 0}
            />
          );
        })}
      </div>

      {showLoadMore && hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={loadMore}
            disabled={loadingMore}
            className="min-w-[140px]"
          >
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
    </div>
  );
};
