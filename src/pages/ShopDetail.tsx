import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CompactProductCard } from "@/components/CompactProductCard";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Store, MapPin, Phone, Mail, ArrowLeft, Package } from "lucide-react";
import { Helmet } from "react-helmet";

interface Shop {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  contact_phone: string;
  contact_email: string;
  provinces?: { name: string };
  districts?: { name: string };
  sectors?: { name: string };
  profiles?: { full_name: string; business_name: string; profile_image: string };
}

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
}

export default function ShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchShop();
      fetchProducts();
    }
  }, [id]);

  const fetchShop = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select(`
          *,
          provinces:province_id (name),
          districts:district_id (name),
          sectors:sector_id (name),
          profiles:seller_id (full_name, business_name, profile_image)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (error) {
      console.error("Error fetching shop:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, price, images, is_negotiable, rental_rate_type, views, likes, discount")
        .eq("shop_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 container mx-auto px-4">
          <Skeleton className="h-48 rounded-xl mb-4" />
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 container mx-auto px-4 text-center py-16">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Shop not found</h2>
          <Link to="/shops">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shops
            </Button>
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const location = [shop.sectors?.name, shop.districts?.name, shop.provinces?.name]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Helmet>
        <title>{shop.name} - Smart Market</title>
        <meta name="description" content={shop.description || `Visit ${shop.name} on Smart Market`} />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <Navbar />

        <main className="pt-20 container mx-auto px-4">
          <Link to="/shops" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Link>

          {/* Shop Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={shop.name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Store className="h-12 w-12 text-primary" />
                  </div>
                )}

                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{shop.name}</h1>
                  {shop.description && (
                    <p className="text-muted-foreground mt-2">{shop.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    {location && (
                      <span className="flex items-center gap-1.5 text-sm bg-muted px-3 py-1.5 rounded-full">
                        <MapPin className="h-4 w-4 text-primary" />
                        {location}
                      </span>
                    )}
                    {shop.contact_phone && (
                      <a
                        href={`tel:${shop.contact_phone}`}
                        className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        {shop.contact_phone}
                      </a>
                    )}
                    {shop.contact_email && (
                      <a
                        href={`mailto:${shop.contact_email}`}
                        className="flex items-center gap-1.5 text-sm bg-muted px-3 py-1.5 rounded-full hover:bg-muted/80 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        {shop.contact_email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Products ({products.length})
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-xl">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No products in this shop yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <CompactProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  images={product.images}
                  isNegotiable={product.is_negotiable}
                  rentalRateType={product.rental_rate_type}
                  views={product.views || 0}
                  rating={0}
                  commentCount={0}
                  likes={product.likes || 0}
                  isLiked={false}
                  discount={product.discount || 0}
                />
              ))}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </>
  );
}