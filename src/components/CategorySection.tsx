import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supaseClient";
import { ProductCard } from "@/components/ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  likes: number;
  views: number;
  is_negotiable: boolean;
  contact_whatsapp: string;
  contact_call: string;
  video_url?: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [category]);

  useEffect(() => {
    // Auto-scroll every 5 seconds
    if (products.length > 0) {
      autoScrollRef.current = setInterval(() => {
        if (scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
          }
        }
      }, 2000);
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [products]);

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
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading || products.length === 0) return null;

  const categorySlug = category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{category}</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => scroll('left')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => scroll('right')}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="w-[calc(50%-6px)] min-w-[calc(50%-6px)] flex-shrink-0">
            <ProductCard
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
              views={(product as any).views || 0}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 text-center">
        <Link to={`/category/${categorySlug}`}>
          <Button variant="outline" size="sm" className="text-primary">
            Explore More {category} →
          </Button>
        </Link>
      </div>
    </div>
  );
}
