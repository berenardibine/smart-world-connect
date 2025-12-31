import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VideoReelProps {
  video: {
    id: string;
    user_id: string;
    title: string | null;
    description: string | null;
    video_url: string;
    views: number;
    likes: number;
    comments_count: number;
    profiles?: {
      full_name: string;
      profile_image: string | null;
    };
  };
  isActive: boolean;
}

export function VideoReel({ video, isActive }: VideoReelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("video_likes")
        .select("id")
        .eq("video_id", video.id)
        .eq("user_id", session.user.id)
        .maybeSingle();

      setLiked(!!data);
    };

    checkLikeStatus();
  }, [video.id]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login required",
        description: "Please login to like videos",
        variant: "destructive",
      });
      return;
    }

    if (liked) {
      await supabase
        .from("video_likes")
        .delete()
        .eq("video_id", video.id)
        .eq("user_id", session.user.id);
      setLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      await supabase
        .from("video_likes")
        .insert({ video_id: video.id, user_id: session.user.id });
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/videos/${video.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title || "Check out this video",
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Video link copied to clipboard",
      });
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] snap-start relative bg-black flex items-center justify-center">
      {/* Video */}
      <video
        ref={videoRef}
        src={video.video_url}
        className="w-full h-full object-contain"
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20" onClick={togglePlay}>
          <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
            <Play className="h-10 w-10 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Volume control */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 bg-black/30 text-white hover:bg-black/50 rounded-full"
        onClick={toggleMute}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>

      {/* Side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-4">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            "w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center",
            liked && "bg-red-500/30"
          )}>
            <Heart className={cn("h-6 w-6 text-white", liked && "fill-red-500 text-red-500")} />
          </div>
          <span className="text-white text-xs font-medium">{likeCount}</span>
        </button>

        {/* Comments */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{video.comments_count}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
      </div>

      {/* Video info */}
      <div className="absolute left-4 bottom-24 right-20">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={video.profiles?.profile_image || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {video.profiles?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-semibold text-sm">
            {video.profiles?.full_name || "User"}
          </span>
        </div>
        
        {video.title && (
          <h3 className="text-white font-medium text-sm mb-1">{video.title}</h3>
        )}
        
        {video.description && (
          <p className="text-white/80 text-xs line-clamp-2">{video.description}</p>
        )}
      </div>
    </div>
  );
}
