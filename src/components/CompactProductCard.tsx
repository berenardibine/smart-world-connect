import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, Star, MessageCircle, Percent } from "lucide-react";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { createProductUrl } from "@/lib/slugify";

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

  return (
    <Link to={productUrl} ref={cardRef as any}>
      <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-border/50 group">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={displayImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 font-semibold">
              <Percent className="h-3 w-3" />
              {discount}% OFF
            </div>
          )}
          
          {/* Price Badge on Image */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            {isNegotiable ? (
              <span className="text-sm font-semibold text-orange-400">💬 Negotiable</span>
            ) : hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-xs text-gray-300 line-through">
                  {price.toLocaleString()} RWF
                </span>
                <span className="text-sm font-bold text-green-400">
                  {discountedPrice.toLocaleString()} RWF
                  {rentalRateType && (
                    <span className="text-xs font-normal opacity-80 ml-1">
                      /{rentalRateType.replace("per_", "")}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-white">
                {price.toLocaleString()} RWF
                {rentalRateType && (
                  <span className="text-xs font-normal opacity-80 ml-1">
                    /{rentalRateType.replace("per_", "")}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={handleLike}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-2.5 space-y-1.5">
          {/* Title */}
          <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          {/* Seller name (only for non-admin products) */}
          {!isAdminProduct && sellerName && (
            <p className="text-xs text-muted-foreground truncate">
              by {sellerName}
            </p>
          )}

          {/* Stats Row - Public Analytics */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {currentViews}
            </span>
            <span className="flex items-center gap-0.5">
              <Star className={`h-3 w-3 ${currentRating > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {currentRating > 0 ? currentRating.toFixed(1) : '0.0'}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="h-3 w-3" />
              {currentComments}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
