import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supaseClient";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { HorizontalNav } from "@/components/home/HorizontalNav";
import { VideoReel } from "@/components/videos/VideoReel";
import { VideoUploadButton } from "@/components/videos/VideoUploadButton";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

interface Video {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  likes: number;
  comments_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
    profile_image: string | null;
  };
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Fetch profiles for each video
      const videoIds = data?.map(v => v.user_id) || [];
      const uniqueUserIds = [...new Set(videoIds)];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_image")
        .in("id", uniqueUserIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const videosWithProfiles = (data || []).map(video => ({
        ...video,
        profiles: profileMap.get(video.user_id) || { full_name: "User", profile_image: null }
      }));
      
      setVideos(videosWithProfiles as Video[]);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <>
      <Helmet>
        <title>Videos | Smart World Connect</title>
        <meta name="description" content="Watch short videos from sellers and creators on Smart World Connect" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <HorizontalNav />

        <div className="pt-[120px] md:pt-[140px]">
          {loading ? (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-4xl">🎥</span>
              </div>
              <h2 className="text-xl font-bold mb-2">No Videos Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Be the first to share a video! Showcase your products, skills, or behind-the-scenes content.
              </p>
              <VideoUploadButton onUploadComplete={loadVideos} />
            </div>
          ) : (
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="h-[calc(100vh-200px)] overflow-y-scroll snap-y snap-mandatory"
            >
              {videos.map((video, index) => (
                <VideoReel
                  key={video.id}
                  video={video}
                  isActive={index === currentIndex}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating upload button */}
        {videos.length > 0 && (
          <div className="fixed bottom-24 right-4 z-50">
            <VideoUploadButton onUploadComplete={loadVideos} compact />
          </div>
        )}

        <BottomNav />
      </div>
    </>
  );
}
