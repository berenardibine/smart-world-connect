import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  seller_id: string;
  category: string;
  description: string;
  likes: number;
  video_url: string | null;
  profiles: {
    full_name: string;
    business_name: string | null;
  } | null;
}

export function AIRecommendedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        // Fetch user's liked products
        const { data: likes } = await supabase
          .from("product_likes")
          .select("product_id")
          .eq("user_id", session.user.id);
        
        if (likes) {
          setLikedProducts(new Set(likes.map(l => l.product_id)));
        }

        // Get user's browsing history
        const { data: history } = await supabase
          .from("user_browsing_history")
          .select("product_id, products(category, title)")
          .eq("user_id", session.user.id)
          .order("viewed_at", { ascending: false })
          .limit(10);

        if (!history || history.length === 0) {
          // No browsing history, show random products
          const { data: randomProducts } = await supabase
            .from("products")
            .select(`
              *,
              profiles:seller_id (full_name, business_name)
            `)
            .eq("status", "approved")
            .limit(8);

          if (randomProducts) {
            // Shuffle products once on load
            const shuffled = [...randomProducts].sort(() => Math.random() - 0.5);
            setProducts(shuffled.slice(0, 4));
          }
          setLoading(false);
          return;
        }

        // Extract categories from browsing history
        const viewedCategories = history
          .map((h: any) => h.products?.category)
          .filter(Boolean);
        
        const viewedProductIds = history.map((h: any) => h.product_id);

        // Get products from similar categories, excluding already viewed
        const { data: recommendedProducts } = await supabase
          .from("products")
          .select(`
            *,
            profiles:seller_id (full_name, business_name)
          `)
          .eq("status", "approved")
          .in("category", viewedCategories)
          .not("id", "in", `(${viewedProductIds.join(",")})`)
          .limit(12);

        if (recommendedProducts && recommendedProducts.length > 0) {
          // Shuffle and take 4
          const shuffled = [...recommendedProducts].sort(() => Math.random() - 0.5);
          setProducts(shuffled.slice(0, 4));
        } else {
          // Fallback to random products
          const { data: fallbackProducts } = await supabase
            .from("products")
            .select(`
              *,
              profiles:seller_id (full_name, business_name)
            `)
            .eq("status", "approved")
            .not("id", "in", `(${viewedProductIds.join(",")})`)
            .limit(8);

          if (fallbackProducts) {
            const shuffled = [...fallbackProducts].sort(() => Math.random() - 0.5);
            setProducts(shuffled.slice(0, 4));
          }
        }
      } catch (error) {
        console.error("Error fetching AI recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Recommended For You</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Recommended For You</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          />
        ))}
      </div>
    </div>
  );
}
