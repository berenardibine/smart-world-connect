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
  is_negotiable: boolean;
  contact_whatsapp: string;
  contact_call: string;
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

  useEffect(() => {
    fetchProducts();
  }, [category]);

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
      const scrollAmount = 300;
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
          <Link to={`/category/${categorySlug}`}>
            <Button variant="link" size="sm" className="text-primary">
              Explore More →
            </Button>
          </Link>
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
            />
          </div>
        ))}
      </div>
    </div>
  );
}
