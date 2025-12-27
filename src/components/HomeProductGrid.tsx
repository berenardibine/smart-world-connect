import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supaseClient";
import { CompactProductCard } from "./CompactProductCard";
import { InlineSellerAds } from "./InlineSellerAds";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminPostedProduct } from "@/lib/seoUrls";
import { shuffleArray } from "@/lib/shuffleArray";

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
  seller_id?: string;
  profiles?: {
    full_name?: string;
    business_name?: string;
    province_id?: string;
    district_id?: string;
    sector_id?: string;
  };
}

interface HomeProductGridProps {
  category?: string;
  limit?: number;
  provinceId?: string;
  districtId?: string;
  sectorId?: string;
}

export const HomeProductGrid = ({ 
  category, 
  limit = 120000,
  provinceId,
  districtId,
  sectorId
}: HomeProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [productStats, setProductStats] = useState<Record<string, { rating: number; commentCount: number }>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchProducts = useCallback(async (offset = 0) => {
    let query = supabase
      .from("products")
      .select(`
        id, title, price, images, is_negotiable, rental_rate_type, views, likes, discount,
        contact_whatsapp, contact_call, seller_id,
        profiles:seller_id (full_name, business_name, province_id, district_id, sector_id)
      `)
      .eq("status", "approved")
      .not("category", "in", '("Agriculture Product","Equipment for Lent")');

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.range(offset, offset + (limit * 3) - 1); // Fetch more to filter

    if (!error && data) {
      let filteredData = data;
      
      // Apply location-based filtering with priority: sector > district > province
      if (sectorId || districtId || provinceId) {
        const sectorMatches = data.filter(p => p.profiles?.sector_id === sectorId);
        const districtMatches = data.filter(p => p.profiles?.district_id === districtId && !sectorMatches.includes(p));
        const provinceMatches = data.filter(p => p.profiles?.province_id === provinceId && !sectorMatches.includes(p) && !districtMatches.includes(p));
        const otherProducts = data.filter(p => !sectorMatches.includes(p) && !districtMatches.includes(p) && !provinceMatches.includes(p));
        
        // Priority order: same sector first, then district, then province, then others
        filteredData = [...sectorMatches, ...districtMatches, ...provinceMatches, ...otherProducts];
      } else {
        // Shuffle products for random display when no location filter
        filteredData = shuffleArray(data);
      }

      // Limit to requested amount
      const limitedData = filteredData.slice(0, offset === 0 ? limit : limit);
      
      if (offset === 0) {
        setProducts(limitedData);
      } else {
        setProducts(prev => [...prev, ...limitedData]);
      }
      setHasMore(data.length >= limit);
      
      // Fetch stats for these products
      await fetchProductStats(limitedData.map(p => p.id));
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [category, limit, provinceId, districtId, sectorId]);


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

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchProducts(products.length);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, products.length, fetchProducts]);

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

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loadingMore && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
