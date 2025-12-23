import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, Check, MessageCircle, Facebook, Linkedin, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supaseClient";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  productId?: string;
}

export function SocialShareButtons({
  url,
  title,
  description,
  image,
  productId,
}: SocialShareButtonsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const trackShare = async (platform: string) => {
    if (productId) {
      try {
        // Update share count in products table
        const { data: product } = await supabase
          .from("products")
          .select("share_count")
          .eq("id", productId)
          .single();
        
        await supabase
          .from("products")
          .update({ share_count: (product?.share_count || 0) + 1 })
          .eq("id", productId);

        // Log analytics
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from("product_analytics").insert({
          product_id: productId,
          viewer_id: session?.user?.id || null,
          type: `share_${platform}`,
        });
      } catch (error) {
        console.error("Share tracking error:", error);
      }
    }
  };

  const shareToWhatsApp = () => {
    trackShare("whatsapp");
    const text = `${title}\n\n${description || ""}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToFacebook = () => {
    trackShare("facebook");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`, "_blank");
  };

  const shareToTwitter = () => {
    trackShare("twitter");
    const text = `${title}\n\n${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToLinkedIn = () => {
    trackShare("linkedin");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  };

  const shareToTelegram = () => {
    trackShare("telegram");
    const text = `${title}\n\n${description || ""}\n\n${url}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyLink = async () => {
    trackShare("copy");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      trackShare("native");
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        });
      } catch (error) {
        // User cancelled
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer gap-2">
          <MessageCircle className="h-4 w-4 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer gap-2">
          <Facebook className="h-4 w-4 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer gap-2">
          <Twitter className="h-4 w-4 text-sky-500" />
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToLinkedIn} className="cursor-pointer gap-2">
          <Linkedin className="h-4 w-4 text-blue-700" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTelegram} className="cursor-pointer gap-2">
          <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer gap-2">
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={nativeShare} className="cursor-pointer gap-2">
            <Share2 className="h-4 w-4" />
            More Options
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
