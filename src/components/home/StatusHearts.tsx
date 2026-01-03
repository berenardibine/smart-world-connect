import { useState, useEffect } from "react";
import { Plus, Heart } from "lucide-react";
import { supabase } from "@/lib/supaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  user: {
    full_name: string;
    profile_image: string | null;
  };
}

export function StatusHearts() {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    loadStories();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }
  };

  const loadStories = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select(`
        id,
        user_id,
        media_url,
        media_type,
        created_at
      `)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      // Get unique users from stories
      const userIds = [...new Set(data.map(s => s.user_id))];
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_image")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const storiesWithUsers = data.map(story => ({
        ...story,
        user: profileMap.get(story.user_id) || { full_name: "User", profile_image: null }
      }));
      
      setStories(storiesWithUsers as Story[]);
    }
  };

  // Group stories by user
  const userStories = stories.reduce((acc, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = {
        user: story.user,
        stories: []
      };
    }
    acc[story.user_id].stories.push(story);
    return acc;
  }, {} as Record<string, { user: Story["user"]; stories: Story[] }>);

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-3 py-2">
        {/* Add Status Button */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <button className="relative group">
            <div className="w-16 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-dashed border-primary/40 flex items-center justify-center group-hover:border-primary/60 group-hover:from-primary/30 transition-all duration-300">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              {/* Heart shape clip path */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <Heart className="h-4 w-4 text-primary fill-primary animate-pulse" />
              </div>
            </div>
          </button>
          <span className="text-xs font-medium text-muted-foreground">Add Status</span>
        </div>

        {/* User Stories */}
        {Object.entries(userStories).map(([userId, data]) => (
          <Dialog key={userId}>
            <DialogTrigger asChild>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                <div className="relative">
                  {/* Heartbeat glow animation */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-destructive opacity-50 blur-sm animate-pulse" />
                  
                  {/* Heart-shaped container */}
                  <div className="relative w-16 h-20 rounded-2xl bg-gradient-to-br from-primary/80 to-destructive/60 p-[2px] group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full rounded-2xl bg-card overflow-hidden flex items-center justify-center">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={data.user.profile_image || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {data.user.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  
                  {/* Heart icon at bottom */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <Heart className="h-4 w-4 text-destructive fill-destructive drop-shadow-lg" 
                      style={{ animation: "heartbeat 1.5s ease-in-out infinite" }} 
                    />
                  </div>
                  
                  {/* Story count badge */}
                  {data.stories.length > 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-md">
                      {data.stories.length}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-foreground truncate max-w-16">
                  {data.user.full_name.split(" ")[0]}
                </span>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-card">
              <div className="relative aspect-[9/16] bg-muted">
                {data.stories[0]?.media_type === "video" ? (
                  <video
                    src={data.stories[0].media_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={data.stories[0]?.media_url}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Story header */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-foreground/60 to-transparent">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary-foreground">
                      <AvatarImage src={data.user.profile_image || undefined} />
                      <AvatarFallback>{data.user.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-primary-foreground font-semibold text-sm">
                      {data.user.full_name}
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}

        {/* Empty state placeholder hearts */}
        {stories.length === 0 && (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 opacity-40">
                <div className="w-16 h-20 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <div className="w-10 h-3 rounded bg-muted/50" />
              </div>
            ))}
          </>
        )}
      </div>
      
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
