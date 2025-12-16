import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { shuffleArray } from "@/lib/shuffleArray";

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
  video_url?: string;
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
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  // Convert slug back to category name
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

  const fetchProducts = async () => {
    setLoading(true);
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
      .eq("category", categoryName);

    if (!error && data) {
      setProducts(shuffleArray(data));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-6">
        <h1 className="text-2xl font-bold mb-6">{categoryName}</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No products found in this category
          </div>
        ) : (
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
                contactWhatsapp={product.contact_whatsapp}
                contactCall={product.contact_call}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
