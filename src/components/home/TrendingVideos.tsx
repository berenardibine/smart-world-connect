import { useState, useEffect, useRef } from "react";
import { Play, Eye, Heart, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Video {
  id: string;
  user_id: string;
  media_url: string;
  content: string | null;
  likes_count: number;
  created_at: string;
}

export function TrendingVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTrendingVideos();
  }, []);

  const loadTrendingVideos = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, media_url, content, likes_count, created_at")
      .eq("media_type", "video")
      .not("media_url", "is", null)
      .order("likes_count", { ascending: false })
      .limit(10);

    if (!error && data) {
      setVideos(data);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-destructive/10">
            <Flame className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Trending Videos</h3>
            <p className="text-xs text-muted-foreground">Hot content from the community</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Videos Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2"
      >
        {videos.map((video) => (
          <Link
            key={video.id}
            to="/videos"
            className="relative flex-shrink-0 w-40 aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer"
            onMouseEnter={() => setHoveredVideo(video.id)}
            onMouseLeave={() => setHoveredVideo(null)}
          >
            <video
              src={video.media_url || ""}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              autoPlay={hoveredVideo === video.id}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
            
            {/* Play Button */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
              hoveredVideo === video.id ? "opacity-0" : "opacity-100"
            }`}>
              <div className="w-12 h-12 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground ml-1" />
              </div>
            </div>

            {/* Stats */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-3 text-primary-foreground text-xs">
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 fill-destructive text-destructive" />
                  <span>{video.likes_count || 0}</span>
                </div>
              </div>
              {video.content && (
                <p className="text-primary-foreground text-xs mt-1 line-clamp-2">
                  {video.content}
                </p>
              )}
            </div>

            {/* Hover glow effect */}
            <div className={`absolute inset-0 ring-2 ring-primary rounded-2xl transition-opacity ${
              hoveredVideo === video.id ? "opacity-100" : "opacity-0"
            }`} />
          </Link>
        ))}
      </div>
    </div>
  );
}
