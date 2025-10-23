import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { ProductCard } from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, MapPin } from "lucide-react";

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerData();
  }, [id]);

  const fetchSellerData = async () => {
    // Fetch seller profile (excluding email and phone)
    const { data: sellerData } = await supabase
      .from("profiles")
      .select("id, full_name, business_name, bio, location, profile_image, rating, rating_count, user_type")
      .eq("id", id)
      .single();

    if (sellerData) {
      setSeller(sellerData);

      // Fetch seller's products
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      setProducts(productsData || []);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!seller) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Seller not found</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <NotificationBell />
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {seller.profile_image && (
                <img
                  src={seller.profile_image}
                  alt={seller.business_name || seller.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  {seller.business_name || seller.full_name}
                </h1>
                {seller.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="h-4 w-4" />
                    {seller.location}
                  </p>
                )}
                <div className="flex items-center gap-1 mb-3">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{seller.rating?.toFixed(1) || "0.0"}</span>
                  <span className="text-sm text-muted-foreground">
                    ({seller.rating_count || 0} reviews)
                  </span>
                </div>
                {seller.bio && (
                  <p className="text-sm text-muted-foreground">{seller.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold mb-4">Products ({products.length})</h2>
          {products.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No products available
              </CardContent>
            </Card>
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
                  sellerName={seller.business_name || seller.full_name}
                  likes={product.likes}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
