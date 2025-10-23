import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useUserStatus } from "@/hooks/useUserStatus";

export default function AgricultureProducts() {
  useUserStatus();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
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

    await fetchProducts();
    setLoading(false);
  };

  const fetchProducts = async () => {
    let query = supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (
          full_name,
          business_name
        )
      `)
      .eq("status", "approved")
      .eq("category", "Agriculture Product");

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
  };

  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        fetchProducts();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agriculture Products</h1>
          <NotificationBell />
        </div>
        <div className="container mx-auto px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agriculture products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? "No agriculture products found matching your search" : "No agriculture products available yet"}
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
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
