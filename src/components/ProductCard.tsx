import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Share2, MapPin, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}: ProductCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const { toast } = useToast();

  const media = [...images];
  if (video) media.push(video);

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
      // Unlike
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
      // Like
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
        // Already liked
        toast({
          title: "Already liked",
          description: "You already liked this product",
        });
      }
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/product/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out ${title}`,
          url,
        });
        
        // Increment share count
        await supabase
          .from("products")
          .update({ share_count: (likeCount || 0) + 1 })
          .eq("id", id);
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard",
      });
    }
  };

  const isVideo = (url: string | undefined) => {
    return url?.includes('.mp4') || url?.includes('.webm') || url?.includes('.mov');
  };

  if (media.length === 0) {
    return null;
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link to={`/product/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {isVideo(media[currentIndex]) ? (
            <div className="relative h-full w-full">
              <video
                src={media[currentIndex]}
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
              src={media[currentIndex]}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          
          {media.length > 1 && (
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
                {media.map((_, idx) => (
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
          
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/product/${id}`}>
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-primary">
            {price.toLocaleString()} RWF
          </span>
        </div>
        {location && (
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 mr-1" />
            {location}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          by <span className="font-medium">{sellerName}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link to={`/product/${id}`} className="w-full">
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
