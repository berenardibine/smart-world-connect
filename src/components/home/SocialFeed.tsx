import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supaseClient";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user: {
    full_name: string;
    profile_image: string | null;
    location: string | null;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

export function SocialFeed({ refreshTrigger }: { refreshTrigger?: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
    getCurrentUser();
    
    // Set up realtime subscription
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          // Fetch the complete post with user info
          fetchSinglePost(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (refreshTrigger) {
      loadPosts();
    }
  }, [refreshTrigger]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }
  };

  const fetchSinglePost = async (postId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (!error && data) {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, profile_image, location")
        .eq("id", data.user_id)
        .single();

      const postWithUser = {
        ...data,
        user: profile || { full_name: "User", profile_image: null, location: null }
      };

      setPosts(prev => [postWithUser, ...prev]);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && postsData) {
      // Get user profiles
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_image, location")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Check likes and saves for current user
      const { data: { session } } = await supabase.auth.getSession();
      let userLikes: string[] = [];
      let userSaves: string[] = [];

      if (session) {
        const [likesResult, savesResult] = await Promise.all([
          supabase
            .from("post_likes")
            .select("post_id")
            .eq("user_id", session.user.id),
          supabase
            .from("saved_posts")
            .select("post_id")
            .eq("user_id", session.user.id)
        ]);

        userLikes = likesResult.data?.map(l => l.post_id) || [];
        userSaves = savesResult.data?.map(s => s.post_id) || [];
      }

      const postsWithUsers = postsData.map(post => ({
        ...post,
        user: profileMap.get(post.user_id) || { full_name: "User", profile_image: null, location: null },
        isLiked: userLikes.includes(post.id),
        isSaved: userSaves.includes(post.id)
      }));

      setPosts(postsWithUsers as Post[]);
    }
    
    setLoading(false);
  };

  const handleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    if (!currentUserId) return;

    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !isCurrentlyLiked,
              likes_count: isCurrentlyLiked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      )
    );

    if (isCurrentlyLiked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: currentUserId });
    }
  };

  const handleSave = async (postId: string, isCurrentlySaved: boolean) => {
    if (!currentUserId) return;

    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, isSaved: !isCurrentlySaved }
          : post
      )
    );

    if (isCurrentlySaved) {
      await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("saved_posts")
        .insert({ post_id: postId, user_id: currentUserId });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="w-24 h-4 rounded bg-muted" />
                <div className="w-16 h-3 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-4 rounded bg-muted" />
              <div className="w-3/4 h-4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
        <p className="text-muted-foreground text-sm">
          Be the first to share something amazing with the community!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <article 
          key={post.id} 
          className="glass-card overflow-hidden animate-fade-in"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {/* Post Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                  <AvatarImage src={post.user.profile_image || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {post.user.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{post.user.full_name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    {post.user.location && (
                      <>
                        <span>•</span>
                        <MapPin className="h-3 w-3" />
                        <span>{post.user.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Post Content */}
          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            </div>
          )}

          {/* Post Media */}
          {post.media_url && (
            <div className="relative">
              {post.media_type === "video" ? (
                <video
                  src={post.media_url}
                  className="w-full max-h-[400px] object-cover"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={post.media_url}
                  alt="Post media"
                  className="w-full max-h-[400px] object-cover"
                />
              )}
            </div>
          )}

          {/* Post Stats */}
          <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-b border-border/50">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Heart className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
              </div>
              <span>{post.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{post.comments_count || 0} comments</span>
              <span>{post.shares_count || 0} shares</span>
            </div>
          </div>

          {/* Post Actions */}
          <div className="px-2 py-1 flex items-center justify-between">
            <Button
              variant="ghost"
              className={`flex-1 gap-2 h-10 rounded-lg ${
                post.isLiked ? "text-destructive hover:text-destructive" : "text-muted-foreground"
              }`}
              onClick={() => handleLike(post.id, post.isLiked || false)}
            >
              <Heart className={`h-5 w-5 transition-transform ${post.isLiked ? "fill-current scale-110" : ""}`} />
              <span className="text-sm font-medium">Like</span>
            </Button>
            <Button
              variant="ghost"
              className="flex-1 gap-2 h-10 rounded-lg text-muted-foreground"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Comment</span>
            </Button>
            <Button
              variant="ghost"
              className="flex-1 gap-2 h-10 rounded-lg text-muted-foreground"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-lg ${
                post.isSaved ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => handleSave(post.id, post.isSaved || false)}
            >
              <Bookmark className={`h-5 w-5 ${post.isSaved ? "fill-current" : ""}`} />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
