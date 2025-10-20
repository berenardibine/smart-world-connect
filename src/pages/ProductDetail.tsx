import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, Eye, MessageCircle, MapPin, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchProduct();
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setCurrentUser(data);
    }
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (
          full_name,
          business_name,
          email,
          profile_image
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
    setLoading(false);
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

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
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
        content: message,
      });

    if (messageError) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Message sent to seller",
    });
    setMessage("");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {product.images && product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1).map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square bg-muted rounded overflow-hidden">
                    <img src={img} alt={`${product.title} ${idx + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            {product.video_url && (
              <video controls className="w-full rounded-lg">
                <source src={product.video_url} type="video/mp4" />
              </video>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <p className="text-2xl font-bold text-primary mb-4">{product.price} RWF</p>
              <p className="text-muted-foreground mb-4">{product.description}</p>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {product.views || 0} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {product.likes || 0} likes
              </span>
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
                <h3 className="font-semibold mb-2">Seller Information</h3>
                <p className="text-sm">{product.profiles?.business_name || product.profiles?.full_name}</p>
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
          </div>
        </div>
      </main>
    </div>
  );
}
