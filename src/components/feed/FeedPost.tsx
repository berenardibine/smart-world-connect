import { useState } from "react";
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    location?: string;
  };
  content: string;
  images?: string[];
  video?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: Date;
}

interface FeedPostProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onMessage?: (userId: string) => void;
}

export function FeedPost({ post, onLike, onComment, onShare, onMessage }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  return (
    <article className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-primary/20">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {post.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
              {post.author.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {post.author.location && (
                <>
                  <span>{post.author.location}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className={cn(
          "grid gap-1",
          post.images.length === 1 && "grid-cols-1",
          post.images.length === 2 && "grid-cols-2",
          post.images.length >= 3 && "grid-cols-2"
        )}>
          {post.images.slice(0, 4).map((image, i) => (
            <div
              key={i}
              className={cn(
                "relative bg-muted aspect-square overflow-hidden cursor-pointer",
                post.images!.length === 3 && i === 0 && "row-span-2"
              )}
            >
              <img
                src={image}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {i === 3 && post.images!.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{post.images!.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-b border-border/50">
        <div className="flex items-center gap-1">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">
            ❤️
          </span>
          <span>{likesCount}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{post.comments} comments</span>
          <span>{post.shares} shares</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "flex-1 rounded-xl gap-2 transition-all duration-200",
            isLiked && "text-red-500 hover:text-red-600"
          )}
        >
          <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
          <span className="hidden sm:inline">Like</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onComment?.(post.id)}
          className="flex-1 rounded-xl gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Comment</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onShare?.(post.id)}
          className="flex-1 rounded-xl gap-2"
        >
          <Share2 className="h-5 w-5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMessage?.(post.author.id)}
          className="flex-1 rounded-xl gap-2"
        >
          <Send className="h-5 w-5" />
          <span className="hidden sm:inline">Message</span>
        </Button>
      </div>
    </article>
  );
}
