import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { createProductShareUrl } from "@/lib/seoUrls";

interface SponsoredProductCardProps {
  id: string;
  postId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  sellerName?: string;
  discount?: number;
}

export const SponsoredProductCard = ({
  id,
  postId,
  title,
  description,
  price,
  images,
  sellerName,
  discount = 0
}: SponsoredProductCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);

  const discountedPrice = discount > 0 ? price - (price * discount / 100) : price;

  const handleClick = async () => {
    // Track click
    const { data: post } = await supabase
      .from("marketing_posts")
      .select("clicks")
      .eq("id", postId)
      .single();

    if (post) {
      await supabase
        .from("marketing_posts")
        .update({ clicks: (post.clicks || 0) + 1 })
        .eq("id", postId);
    }

    const url = createProductShareUrl(id, title, sellerName, false);
    const path = url.replace(window.location.origin, '');
    navigate(path);
  };

  // Track impression on mount
  useEffect(() => {
    if (!hasTracked) {
      const trackImpression = async () => {
        const { data: post } = await supabase
          .from("marketing_posts")
          .select("impressions")
          .eq("id", postId)
          .single();

        if (post) {
          await supabase
            .from("marketing_posts")
            .update({ impressions: (post.impressions || 0) + 1 })
            .eq("id", postId);
        }
      };
      trackImpression();
      setHasTracked(true);
    }
  }, [postId, hasTracked]);

  return (
    <div 
      className="relative bg-gradient-to-r from-primary/5 via-background to-primary/5 border border-primary/20 rounded-xl p-4 my-4 cursor-pointer hover:shadow-lg transition-all"
      onClick={handleClick}
    >
      <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        Sponsored
      </Badge>
      
      <div className="flex gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
          )}
          <img
            src={images[0] || "/placeholder.svg"}
            alt={title}
            className={`w-full h-full object-cover rounded-lg ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
          {discount > 0 && (
            <Badge className="absolute -top-1 -left-1 bg-red-500 text-white text-xs">
              -{discount}%
            </Badge>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base line-clamp-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
          
          <div className="flex items-center gap-2 mt-2">
            {discount > 0 ? (
              <>
                <span className="text-lg font-bold text-primary">
                  {discountedPrice.toLocaleString()} RWF
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {price.toLocaleString()} RWF
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-primary">
                {price.toLocaleString()} RWF
              </span>
            )}
          </div>
          
          {sellerName && (
            <p className="text-xs text-muted-foreground mt-1">
              By {sellerName}
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-primary/10 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Promoted product
        </span>
        <Button size="sm" variant="outline" className="text-xs h-7">
          View Details
        </Button>
      </div>
    </div>
  );
};
