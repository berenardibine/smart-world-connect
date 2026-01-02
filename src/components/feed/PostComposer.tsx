import { useState, useRef } from "react";
import { Image, Video, MapPin, Smile, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supaseClient";
import { toast } from "sonner";

interface PostComposerProps {
  onPost?: (content: string, images?: string[]) => void;
  userImage?: string;
  userName?: string;
}

export function PostComposer({ onPost, userImage, userName }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsPosting(true);
    try {
      // TODO: Implement actual post creation
      onPost?.(content);
      toast.success("Post shared successfully!");
      setContent("");
      setIsExpanded(false);
    } catch (error) {
      toast.error("Failed to share post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm transition-all duration-300">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarImage src={userImage} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {userName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={handleFocus}
            placeholder="What's on your mind?"
            className={cn(
              "resize-none border-0 bg-muted/50 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/30 placeholder:text-muted-foreground/70 transition-all duration-300",
              isExpanded ? "min-h-[100px]" : "min-h-[44px]"
            )}
          />
          
          {isExpanded && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Image className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <MapPin className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">AI Suggest</span>
                </Button>
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={!content.trim() || isPosting}
                size="sm"
                className="rounded-xl gap-2 px-4"
              >
                <Send className="h-4 w-4" />
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
