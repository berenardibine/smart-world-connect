import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supaseClient";
import { CompactProductCard } from "@/components/CompactProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { isAdminPostedProduct } from "@/lib/seoUrls";
import { shuffleArray } from "@/lib/shuffleArray";

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

interface CategorySectionProps {
  category: string;
  likedProducts: Set<string>;
}

export function CategorySection({ category, likedProducts }: CategorySectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productStats, setProductStats] = useState<Record<string, { rating: number; commentCount: number }>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [category]);

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

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (full_name, business_name)
      `)
      .eq("status", "approved")
      .eq("category", category)
      .order("views", { ascending: false })
      .limit(10);

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
        left: direction === 'left' ? -160 : 160,
        behavior: 'smooth'
      });
    }
  };

  if (loading || products.length === 0) return null;

  const categorySlug = category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold">{category}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => scroll('left')} className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => scroll('right')} className="h-7 w-7">
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

      <div className="mt-2 text-center">
        <Link to={`/category/${categorySlug}`}>
          <Button variant="link" size="sm" className="text-primary text-xs">
            Explore More →
          </Button>
        </Link>
      </div>
    </div>
  );
}
