import { useState, useEffect } from "react";
import { supabase } from "@/lib/supaseClient";
import { useRegion } from "@/contexts/RegionContext";
import { CompactProductCard } from "./CompactProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, MapPin } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  is_negotiable?: boolean;
  rental_rate_type?: string;
  views?: number;
  likes?: number;
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

interface RegionalProductsProps {
  limit?: number;
  title?: string;
}

export function RegionalProducts({ limit = 8, title = "Local Products" }: RegionalProductsProps) {
  const { currentLocation, userProfile } = useRegion();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [productStats, setProductStats] = useState<Record<string, { rating: number; commentCount: number }>>({});

  useEffect(() => {
    fetchRegionalProducts();
    fetchUserLikes();
  }, [currentLocation, userProfile]);

  const fetchRegionalProducts = async () => {
    setLoading(true);
    try {
      const { data: allProducts, error } = await supabase
        .from("products")
        .select(`
          id, title, price, images, is_negotiable, rental_rate_type, views, likes, discount, seller_id,
          profiles:seller_id (full_name, business_name, province_id, district_id, sector_id)
        `)
        .eq("status", "approved")
        .limit(limit * 3);

      if (error) throw error;

      // Get location IDs for filtering
      const sectorId = userProfile?.sector_id || (currentLocation?.type === 'sector' ? currentLocation?.id : null);
      const districtId = userProfile?.district_id || (currentLocation?.type === 'district' ? currentLocation?.id : null);
      const provinceId = userProfile?.province_id || (currentLocation?.type === 'province' ? currentLocation?.id : null);

      if (allProducts) {
        // Prioritize products by location proximity
        const sectorMatches = allProducts.filter(p => p.profiles?.sector_id === sectorId);
        const districtMatches = allProducts.filter(p => p.profiles?.district_id === districtId && !sectorMatches.includes(p));
        const provinceMatches = allProducts.filter(p => p.profiles?.province_id === provinceId && !sectorMatches.includes(p) && !districtMatches.includes(p));
        const otherProducts = allProducts.filter(p => !sectorMatches.includes(p) && !districtMatches.includes(p) && !provinceMatches.includes(p));

        const sortedProducts = [...sectorMatches, ...districtMatches, ...provinceMatches, ...otherProducts];
        const limitedProducts = sortedProducts.slice(0, limit);
        setProducts(limitedProducts);
        
        // Fetch stats
        if (limitedProducts.length > 0) {
          await fetchProductStats(limitedProducts.map(p => p.id));
        }
      }
    } catch (error) {
      console.error("Error fetching regional products:", error);
    } finally {
      setLoading(false);
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
        stats[id] = {
          rating: avgRating,
          commentCount: productComments.length
        };
      });
      
      setProductStats(stats);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <div className="text-center py-8 bg-muted/30 rounded-xl">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No products found in your area</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try changing your location to see more products
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">{title}</h2>
        {currentLocation && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {currentLocation.name}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map((product) => {
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
              discount={product.discount || 0}
            />
          );
        })}
      </div>
    </div>
  );
}
