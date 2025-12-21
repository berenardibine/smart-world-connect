import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SponsoredProductCard } from "./SponsoredProductCard";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ExternalLink } from "lucide-react";

interface SellerAd {
  id: string;
  title: string;
  content: string;
  post_type: string;
  product_id: string | null;
  images: string[] | null;
  link_url: string | null;
  link_text: string | null;
  seller_id: string;
  impressions: number | null;
  clicks: number | null;
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
    discount: number | null;
  };
  seller?: {
    full_name: string;
    business_name: string | null;
  };
}

export const InlineSellerAds = () => {
  const [ads, setAds] = useState<SellerAd[]>([]);

  useEffect(() => {
    fetchSellerAds();
  }, []);

  const fetchSellerAds = async () => {
    const { data, error } = await supabase
      .from("marketing_posts")
      .select(`
        id, title, content, post_type, product_id, images, link_url, link_text, seller_id, impressions, clicks,
        product:product_id (id, title, price, images, discount)
      `)
      .eq("is_active", true)
      .eq("status", "active")
      .not("seller_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      // Fetch seller info separately
      const sellerIds = [...new Set(data.map(d => d.seller_id).filter(Boolean))];
      const { data: sellers } = await supabase
        .from("profiles")
        .select("id, full_name, business_name")
        .in("id", sellerIds);

      const adsWithSellers = data.map(ad => ({
        ...ad,
        seller: sellers?.find(s => s.id === ad.seller_id)
      }));

      setAds(adsWithSellers as SellerAd[]);

      // Track impressions for all loaded ads
      for (const ad of data) {
        await supabase
          .from("marketing_posts")
          .update({ impressions: ((ad as any).impressions || 0) + 1 })
          .eq("id", ad.id);
      }
    }
  };

  const handleAdClick = async (adId: string, linkUrl?: string | null) => {
    // Track click
    const { data: ad } = await supabase
      .from("marketing_posts")
      .select("clicks")
      .eq("id", adId)
      .single();

    await supabase
      .from("marketing_posts")
      .update({ clicks: (ad?.clicks || 0) + 1 })
      .eq("id", adId);

    if (linkUrl) {
      window.open(linkUrl, "_blank");
    }
  };

  if (ads.length === 0) return null;

  return (
    <div className="space-y-4">
      {ads.map((ad) => {
        // If it's a product boost, show product card
        if (ad.post_type === "boost" && ad.product) {
          return (
            <SponsoredProductCard
              key={ad.id}
              id={ad.product.id}
              postId={ad.id}
              title={ad.product.title}
              description={ad.content}
              price={ad.product.price}
              images={ad.product.images || []}
              sellerName={ad.seller?.business_name || ad.seller?.full_name}
              discount={ad.product.discount || 0}
            />
          );
        }

        // Marketing post - show inline ad card
        return (
          <div
            key={ad.id}
            className="relative bg-gradient-to-r from-secondary/50 via-background to-secondary/50 border border-border rounded-xl p-4 my-4"
          >
            <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-xs flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Promoted
            </Badge>

            <div className="flex gap-4">
              {ad.images && ad.images[0] && (
                <div className="w-20 h-20 flex-shrink-0">
                  <img
                    src={ad.images[0]}
                    alt={ad.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{ad.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {ad.content}
                </p>
                
                {ad.seller && (
                  <p className="text-xs text-muted-foreground mt-2">
                    By {ad.seller.business_name || ad.seller.full_name}
                  </p>
                )}
              </div>
            </div>

            {ad.link_url && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <button
                  onClick={() => handleAdClick(ad.id, ad.link_url)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {ad.link_text || "Learn More"}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
