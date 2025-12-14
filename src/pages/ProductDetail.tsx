import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, Eye, MessageCircle, MapPin, ArrowLeft, Star, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useUserStatus } from "@/hooks/useUserStatus";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";
import { RecommendedProducts } from "@/components/RecommendedProducts";
import { useProductImpression } from "@/hooks/useProductImpression";
import { useBrowsingHistory } from "@/hooks/useBrowsingHistory";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { extractProductId } from "@/lib/slugify";

// Message validation schema
const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long (max 1000 characters)'),
});

export default function ProductDetail() {
  useUserStatus();
  const { slugId } = useParams();
  const id = extractProductId(slugId || '');
  useProductImpression(id || '');
  useBrowsingHistory(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    checkAuth();
    fetchProduct();

    // Track view with intersection observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedView.current) {
          trackProductView();
          hasTrackedView.current = true;
        }
      },
      { threshold: 0.5 }
    );

    if (productRef.current) {
      observer.observe(productRef.current);
    }

    return () => {
      if (productRef.current) {
        observer.unobserve(productRef.current);
      }
    };
  }, [id]);

  const trackProductView = async () => {
    await supabase.rpc('increment_product_view', { product_uuid: id });
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setCurrentUser(data);

      // Check if user liked this product
      const { data: likeData } = await supabase
        .from("product_likes")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("product_id", id)
        .maybeSingle();

      setIsLiked(!!likeData);

      // Check if user rated the seller
      const { data: ratingData } = await supabase
        .from("product_ratings")
        .select("rating")
        .eq("user_id", session.user.id)
        .eq("product_id", id)
        .maybeSingle();

      if (ratingData) {
        setUserRating(ratingData.rating);
      }
    }
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (
          id,
          full_name,
          business_name,
          profile_image,
          rating,
          rating_count
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setProduct(data);

    // Fetch seller profile with contact numbers
    const { data: sellerData } = await supabase
      .from("profiles")
      .select("full_name, business_name, whatsapp_number, call_number")
      .eq("id", data.seller_id)
      .single();

    if (sellerData) {
      setSeller(sellerData);
    }

    // Get like count
    const { count } = await supabase
      .from("product_likes")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);

    setLikeCount(count || 0);

    setLoading(false);
  };

  const toggleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please sign in to like products",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (isLiked) {
      // Unlike
      await supabase
        .from("product_likes")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("product_id", id);

      setIsLiked(false);
      setLikeCount(likeCount - 1);
    } else {
      // Like
      await supabase
        .from("product_likes")
        .insert({ user_id: currentUser.id, product_id: id });

      setIsLiked(true);
      setLikeCount(likeCount + 1);
    }
  };


  const sendMessage = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please sign in to send messages",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Validate message
    try {
      messageSchema.parse({ content: message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Check if conversation exists
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("product_id", product.id)
      .eq("buyer_id", currentUser.id)
      .eq("seller_id", product.seller_id)
      .single();

    // Create conversation if it doesn't exist
    if (!conversation) {
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          product_id: product.id,
          buyer_id: currentUser.id,
          seller_id: product.seller_id,
        })
        .select()
        .single();

      if (convError) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        return;
      }

      conversation = newConversation;
    }

    // Send message
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        content: message.trim(),
        delivered_at: new Date().toISOString(),
      });

    if (messageError) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return;
    }

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id);

    toast({
      title: "Success",
      description: "Message sent! Opening messages...",
    });
    setMessage("");
    
    // Navigate to messages page immediately
    navigate("/messages");
  };

  const submitRating = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please sign in to rate",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("product_ratings")
        .insert({
          user_id: currentUser.id,
          product_id: id,
          seller_id: product.seller_id,
          rating: rating,
        });

      if (error) throw error;

      setUserRating(rating);
      setShowRatingDialog(false);
      toast({
        title: "Success",
        description: "Rating submitted successfully",
      });
      
      // Refresh product to show updated rating
      fetchProduct();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Helmet>
        <title>{product.title} - Rwanda Smart Market</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.images?.[0] || '/placeholder.svg'} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={product.images?.[0] || '/placeholder.svg'} />
      </Helmet>
      <div className="min-h-screen bg-background pb-20" ref={productRef}>
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Main Image Display */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border cursor-pointer"
                 onClick={() => product.images?.length > 0 && setShowFullScreen(true)}>
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImageIndex]}
                  alt={`${product.title} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src="/placeholder.svg"
                    alt={product.title}
                    className="w-full h-full object-cover opacity-50"
                  />
                </div>
              )}
            </div>
            
            {/* Image Thumbnails Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-square bg-muted rounded overflow-hidden border-2 transition-all hover:border-primary ${
                      idx === selectedImageIndex ? 'border-primary ring-2 ring-primary' : 'border-border'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product.title} thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Video Player */}
            {product.video_url && (
              <div className="rounded-lg overflow-hidden border-2 border-border">
                <video controls className="w-full">
                  <source src={product.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-2xl font-bold text-primary">
                  {product.price} RWF
                  {product.rental_rate_type && (
                    <span className="text-base font-normal text-muted-foreground ml-1">
                      /{product.rental_rate_type.replace("per_", "")}
                    </span>
                  )}
                </p>
                {product.is_negotiable && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Negotiable
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{product.description}</p>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {product.views || 0} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {likeCount} likes
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="lg"
                onClick={toggleLike}
                className="flex-1"
              >
                <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? "Liked" : "Like"}
              </Button>
            </div>

            <div className="space-y-2">
              <p><strong>Category:</strong> {product.category || "Uncategorized"}</p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {product.location || "Location not specified"}
              </p>
              <p><strong>Quantity:</strong> {product.quantity} available</p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold mb-2">Seller Information</h3>
                    <Link to={`/seller-profile/${product.seller_id}`} className="hover:underline">
                      <p className="text-sm mb-1">{product.profiles?.business_name || product.profiles?.full_name}</p>
                    </Link>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {product.profiles?.rating?.toFixed(1) || "0.0"} ({product.profiles?.rating_count || 0} reviews)
                    </p>
                  </div>
                  {!userRating && currentUser?.id !== product.seller_id && (
                    <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Rate Seller
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rate this Seller</DialogTitle>
                          <DialogDescription>
                            Share your experience with {product.profiles?.business_name || product.profiles?.full_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-8 w-8 ${
                                    star <= rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <Button onClick={submitRating} className="w-full">
                            Submit Rating
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                {userRating > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    You rated: {[...Array(userRating)].map((_, i) => (
                      <Star key={i} className="inline h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Message Seller
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Message to Seller</DialogTitle>
                  <DialogDescription>
                    Send a message about {product.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
                  <Button onClick={sendMessage} className="w-full">
                    Send Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Use product-level contact if available (admin products), otherwise use seller profile */}
            {(product.contact_whatsapp || seller?.whatsapp_number) && (
              <Button
                onClick={() => {
                  const whatsappNumber = product.contact_whatsapp || seller?.whatsapp_number;
                  const productUrl = window.location.href;
                  const firstImage = product.images?.[0] || '';
                  const message = `Hi, I'm interested in your product: ${product.title}\n\nProduct Link: ${productUrl}\n\nProduct Image: ${firstImage}`;
                  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                size="lg"
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact on WhatsApp
              </Button>
            )}

            {(product.contact_call || seller?.call_number) && (
              <Button
                onClick={() => {
                  const callNumber = product.contact_call || seller?.call_number;
                  window.location.href = `tel:${callNumber}`;
                }}
                size="lg"
                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call Seller Directly
              </Button>
            )}
          </div>
        </div>
      </main>

      {product.images && product.images.length > 0 && (
        <FullScreenImageViewer
          images={product.images}
          currentIndex={selectedImageIndex}
          isOpen={showFullScreen}
          onClose={() => setShowFullScreen(false)}
          onPrevious={() => setSelectedImageIndex((prev) => 
            prev > 0 ? prev - 1 : product.images.length - 1
          )}
          onNext={() => setSelectedImageIndex((prev) => 
            prev < product.images.length - 1 ? prev + 1 : 0
          )}
        />
      )}

      <DashboardFloatingButton />
      <BottomNav />
    </div>
    </>
  );
}
