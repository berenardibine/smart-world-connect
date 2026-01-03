import { useState, useEffect } from "react";
import { Flame, Palette, Lightbulb, TrendingUp, Sparkles, Award } from "lucide-react";
import { supabase } from "@/lib/supaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface TrendingHashtag {
  hashtag: string;
  usage_count: number;
}

interface SpotlightUser {
  id: string;
  full_name: string;
  profile_image: string | null;
  post_count: number;
}

export function TrendingSection() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);

  useEffect(() => {
    loadTrendingHashtags();
  }, []);

  const loadTrendingHashtags = async () => {
    const { data, error } = await supabase
      .from("trending_hashtags")
      .select("hashtag, usage_count")
      .order("usage_count", { ascending: false })
      .limit(5);

    if (!error && data) {
      setHashtags(data);
    }
  };

  if (hashtags.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-foreground">Trending Today</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <span
            key={tag.hashtag}
            className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 cursor-pointer transition-colors"
          >
            #{tag.hashtag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CreatorSpotlight() {
  const [creator, setCreator] = useState<SpotlightUser | null>(null);

  useEffect(() => {
    loadSpotlightCreator();
  }, []);

  const loadSpotlightCreator = async () => {
    // Get the most active user today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("posts")
      .select("user_id")
      .gte("created_at", today.toISOString())
      .limit(100);

    if (!error && data && data.length > 0) {
      // Count posts per user
      const userCounts: Record<string, number> = {};
      data.forEach(post => {
        userCounts[post.user_id] = (userCounts[post.user_id] || 0) + 1;
      });

      // Get the user with most posts
      const topUserId = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      if (topUserId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, profile_image")
          .eq("id", topUserId)
          .single();

        if (profile) {
          setCreator({
            ...profile,
            post_count: userCounts[topUserId]
          });
        }
      }
    }
  };

  if (!creator) {
    return null;
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="h-5 w-5 text-info" />
        <h3 className="font-semibold text-foreground">Creator Spotlight</h3>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-info">
            <AvatarImage src={creator.profile_image || undefined} />
            <AvatarFallback className="bg-info/10 text-info">
              {creator.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-info flex items-center justify-center">
            <Award className="h-3 w-3 text-info-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{creator.full_name}</p>
          <p className="text-xs text-muted-foreground">{creator.post_count} posts today</p>
        </div>
      </div>
    </div>
  );
}

export function AISuggestion() {
  const suggestions = [
    "Share your morning routine! ☀️",
    "What are you grateful for today? 🙏",
    "Show us your workspace setup! 💻",
    "Share a life hack you discovered! 💡",
    "What book are you reading? 📚",
  ];

  const [suggestion] = useState(
    suggestions[Math.floor(Math.random() * suggestions.length)]
  );

  return (
    <div className="glass-card p-4 bg-gradient-to-br from-primary/5 to-info/5 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">AI Suggestion</h3>
      </div>
      <p className="text-sm text-muted-foreground">{suggestion}</p>
      <button className="mt-3 text-xs font-medium text-primary hover:underline">
        Create post →
      </button>
    </div>
  );
}

export function FeedInserts({ index }: { index: number }) {
  // Show different inserts at different positions in the feed
  if (index === 2) {
    return <TrendingSection />;
  }
  if (index === 5) {
    return <CreatorSpotlight />;
  }
  if (index === 8) {
    return <AISuggestion />;
  }
  return null;
}
