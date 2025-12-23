import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, Star, MessageCircle, Percent, Share2 } from "lucide-react";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { createProductUrl } from "@/lib/slugify";
import { createProductShareUrl } from "@/lib/seoUrls";

interface CompactProductCardProps {
  id: string;
  title: string;
  price: number;
  images: string[];
  isNegotiable?: boolean;
  rentalRateType?: string;
  views?: number;
  rating?: number;
  commentCount?: number;
  likes?: number;
  isLiked?: boolean;
  sellerName?: string;
  isAdminProduct?: boolean;
  discount?: number;
}

export const CompactProductCard = ({
  id,
  title,
  price,
  images,
  isNegotiable = false,
  rentalRateType,
  views = 0,
  rating = 0,
  commentCount = 0,
  likes = 0,
  isLiked = false,
  sellerName,
  isAdminProduct = false,
  discount = 0,
}: CompactProductCardProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [currentViews, setCurrentViews] = useState(views);
  const [currentRating, setCurrentRating] = useState(rating);
  const [currentComments, setCurrentComments] = useState(commentCount);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const productUrl = createProductUrl(id, title);
  const displayImage = images?.[0] || '/placeholder.svg';
  
  // Calculate discounted price
  const hasDiscount = discount && discount > 0;
  const discountedPrice = hasDiscount ? price - (price * discount / 100) : price;

  // Track view when card is visible for 2 seconds
  useEffect(() => {
    if (!cardRef.current || !id) return;

    let timer: NodeJS.Timeout;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              await supabase.from("product_analytics").insert({
                product_id: id,
                viewer_id: session?.user?.id || null,
                type: "view",
              });
            } catch (error) {
              // Silently fail
            }
          }, 2000);
        } else {
          clearTimeout(timer);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [id]);

  // Subscribe to realtime updates for this product
  useEffect(() => {
    const channel = supabase
      .channel(`product-stats-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setCurrentViews(payload.new.views || 0);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `product_id=eq.${id}`,
        },
        () => {
          // Refresh comment count
          fetchCommentStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchCommentStats = async () => {
    const { data } = await supabase
      .from('comments')
      .select('rating')
      .eq('product_id', id);
    
    if (data) {
      setCurrentComments(data.length);
      if (data.length > 0) {
        const avgRating = data.reduce((sum, c) => sum + (c.rating || 0), 0) / data.length;
        setCurrentRating(avgRating);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login required",
        description: "Please login to like products",
        variant: "destructive",
      });
      return;
    }

    if (liked) {
      await supabase
        .from("product_likes")
        .delete()
        .eq("product_id", id)
        .eq("user_id", session.user.id);
      setLiked(false);
    } else {
      await supabase
        .from("product_likes")
        .insert({ product_id: id, user_id: session.user.id });
      setLiked(true);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = createProductShareUrl(id, title, sellerName || '', isAdminProduct);
    
    // Track share
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: product } = await supabase
        .from("products")
        .select("share_count")
        .eq("id", id)
        .single();
      
      await supabase
        .from("products")
        .update({ share_count: (product?.share_count || 0) + 1 })
        .eq("id", id);

      await supabase.from("product_analytics").insert({
        product_id: id,
        viewer_id: session?.user?.id || null,
        type: "share",
      });
    } catch (error) {
      // Silently fail
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} | Rwanda Smart Market`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Product link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Link to={productUrl} ref={cardRef as any}>
      <article className="bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-border/50 group">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={displayImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-bold shadow-lg">
              <Percent className="h-3 w-3" />
              {discount}% OFF
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
            {isNegotiable ? (
              <div className="flex flex-col">
                <span className="text-xs text-orange-300 font-medium">💬 Negotiable</span>
                <span className="text-sm sm:text-base font-bold text-white">
                  {price.toLocaleString()} RWF
                </span>
              </div>
            ) : hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-xs text-gray-300 line-through">
                  {price.toLocaleString()} RWF
                </span>
                <span className="text-sm sm:text-base font-bold text-green-400">
                  {Math.round(discountedPrice).toLocaleString()} RWF
                  {rentalRateType && (
                    <span className="text-xs font-normal opacity-80 ml-1">
                      /{rentalRateType.replace("per_", "")}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-bold text-white">
                {price.toLocaleString()} RWF
                {rentalRateType && (
                  <span className="text-xs font-normal opacity-80 ml-1">
                    /{rentalRateType.replace("per_", "")}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <button
              onClick={handleLike}
              className="p-2 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm hover:bg-white dark:hover:bg-black/70 transition-all duration-200 shadow-lg hover:scale-110"
              aria-label={liked ? "Unlike product" : "Like product"}
            >
              <Heart className={`h-4 w-4 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm hover:bg-white dark:hover:bg-black/70 transition-all duration-200 shadow-lg hover:scale-110"
              aria-label="Share product"
            >
              <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[2.5rem]">
            {title}
          </h3>
          
          {/* Seller name (only for non-admin products) */}
          {!isAdminProduct && sellerName && (
            <p className="text-xs text-muted-foreground truncate">
              by <span className="font-medium text-foreground/70">{sellerName}</span>
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium">{currentViews}</span>
            </span>
            <span className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Star className={`h-3.5 w-3.5 ${currentRating > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              <span className="font-medium">{currentRating > 0 ? currentRating.toFixed(1) : '0.0'}</span>
            </span>
            <span className="flex items-center gap-1 hover:text-foreground transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="font-medium">{currentComments}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};