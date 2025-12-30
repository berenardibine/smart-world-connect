import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, ChevronLeft, ChevronRight, Play, Eye, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { createProductUrl } from "@/lib/slugify";
import { createProductShareUrl, isAdminPostedProduct } from "@/lib/seoUrls";
import { ShareButton } from "@/components/ShareButton";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  images: string[];
  video?: string;
  location?: string;
  sellerName: string;
  likes?: number;
  isLiked?: boolean;
  isNegotiable?: boolean;
  rentalRateType?: string;
  contactWhatsapp?: string | null;
  contactCall?: string | null;
  views?: number;
  rating?: number;
  commentCount?: number;
}

export const ProductCard = ({
  id,
  title,
  price,
  images,
  video,
  location,
  sellerName,
  likes = 0,
  isLiked = false,
  isNegotiable = false,
  rentalRateType,
  contactWhatsapp,
  contactCall,
  views = 0,
  rating = 0,
  commentCount = 0,
}: ProductCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const media = [...images];
  if (video) media.push(video);

  // Determine if this is an admin-posted product
  const isAdminProduct = isAdminPostedProduct({ contact_whatsapp: contactWhatsapp, contact_call: contactCall });

  // Generate share URL
  const shareUrl = createProductShareUrl(id, title, sellerName, isAdminProduct);

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
          }, 2000000);
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

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
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
      const { error } = await supabase
        .from("product_likes")
        .delete()
        .eq("product_id", id)
        .eq("user_id", session.user.id);

      if (!error) {
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      }
    } else {
      const { error } = await supabase
        .from("product_likes")
        .insert({
          product_id: id,
          user_id: session.user.id,
        });

      if (!error) {
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      } else if (error.code === '23505') {
        toast({
          title: "Already liked",
          description: "You already liked this product",
        });
      }
    }
  };

  const isVideo = (url: string | undefined) => {
    return url?.includes('.mp4') || url?.includes('.webm') || url?.includes('.mov');
  };

  const displayMedia = media.length > 0 ? media : ['/placeholder.svg'];
  const productUrl = createProductUrl(id, title);

  return (
    <Card ref={cardRef} className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link to={productUrl}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {isVideo(displayMedia[currentIndex]) ? (
            <div className="relative h-full w-full">
              <video
                src={displayMedia[currentIndex]}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
          ) : (
            <img
              src={displayMedia[currentIndex]}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          
          {displayMedia.length > 1 && media.length > 1 && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {displayMedia.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Views count */}
          
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={productUrl}>
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {price.toLocaleString()} RWF
              {rentalRateType && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  /{rentalRateType.replace("per_", "")}
                </span>
              )}
            </span>
            {isNegotiable && (
              <span className="text-xs text-green-600 font-medium">
                Negotiable
              </span>
            )}
          </div>
        </div>
        {location && (
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 mr-1" />
            {location}
          </div>
        )}
        
        {/* Public stats: views, rating, comments */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {views}
          </span>
          {rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {commentCount}
            </span>
          )}
        </div>
        
        {/* Only show seller name for non-admin products */}
        {!isAdminProduct && (
          <div className="text-sm text-muted-foreground">
            by <span className="font-medium">{sellerName}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link to={productUrl} className="flex-1">
          <Button className="w-full">View Details</Button>
        </Link>
        <ShareButton
          url={shareUrl}
          title={`${title} - Rwanda Smart Market`}
          description={`Check out ${title} on Rwanda Smart Market`}
          size="icon"
          variant="outline"
        />
      </CardFooter>
    </Card>
  );
};
