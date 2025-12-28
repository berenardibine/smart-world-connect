import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Heart,
  Send,
  Pin,
  MoreVertical,
  Settings,
  Image as ImageIcon,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BottomNav } from "@/components/BottomNav";

interface Community {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  logo_image: string | null;
  member_count: number;
  is_public: boolean;
  seller_id: string;
  posting_permission: string;
  rules: string[];
}

interface Post {
  id: string;
  content: string;
  images: string[];
  video_url: string | null;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  author_id: string;
  author?: {
    full_name: string;
    profile_image: string | null;
    user_type: string;
  };
}

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCommunityData();
    }
  }, [id]);

  const fetchCommunityData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      setCurrentUserId(userId || null);

      // Fetch community
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);
      setIsOwner(userId === communityData.seller_id);

      // Check membership
      if (userId) {
        const { data: memberData } = await supabase
          .from("community_members")
          .select("id")
          .eq("community_id", id)
          .eq("user_id", userId)
          .maybeSingle();
        
        setIsMember(!!memberData);
      }

      // Fetch posts with author info
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select("*")
        .eq("community_id", id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch author profiles
      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(p => p.author_id))];
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("id, full_name, profile_image, user_type")
          .in("id", authorIds);

        const postsWithAuthors = postsData.map(post => ({
          ...post,
          author: profiles?.find(p => p.id === post.author_id) || null,
        }));
        setPosts(postsWithAuthors);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUserId) {
      navigate("/auth?mode=signup");
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase
        .from("community_members")
        .insert({
          community_id: id,
          user_id: currentUserId,
          role: "member",
        });

      if (error) throw error;

      setIsMember(true);
      toast({ title: "Joined community!" });
      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", id)
        .eq("user_id", currentUserId);

      if (error) throw error;

      setIsMember(false);
      toast({ title: "Left community" });
      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !currentUserId || !id) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .insert({
          community_id: id,
          author_id: currentUserId,
          content: newPost.trim(),
        });

      if (error) throw error;

      setNewPost("");
      toast({ title: "Post created!" });
      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUserId) {
      navigate("/auth?mode=signup");
      return;
    }

    try {
      // Check if already liked
      const { data: existing } = await supabase
        .from("community_post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (existing) {
        // Unlike
        await supabase
          .from("community_post_likes")
          .delete()
          .eq("id", existing.id);
        
        await supabase
          .from("community_posts")
          .update({ likes_count: posts.find(p => p.id === postId)!.likes_count - 1 })
          .eq("id", postId);
      } else {
        // Like
        await supabase
          .from("community_post_likes")
          .insert({ post_id: postId, user_id: currentUserId });
        
        await supabase
          .from("community_posts")
          .update({ likes_count: posts.find(p => p.id === postId)!.likes_count + 1 })
          .eq("id", postId);
      }

      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const canPost = isMember || isOwner || community?.posting_permission === "all_members";

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4">
          <Link to="/community" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to communities
          </Link>
          <p className="text-center text-muted-foreground">Community not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
        {community.cover_image && (
          <img
            src={community.cover_image}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
        <Link
          to="/community"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {isOwner && (
          <Link
            to={`/seller/community/${id}/settings`}
            className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-full"
          >
            <Settings className="h-5 w-5" />
          </Link>
        )}
      </div>

      {/* Community Info */}
      <div className="px-4 -mt-10 relative">
        <div className="flex items-end gap-4 mb-4">
          <Avatar className="w-20 h-20 border-4 border-background">
            <AvatarImage src={community.logo_image || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {community.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-2">
            <h1 className="text-xl font-bold">{community.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{community.member_count} members</span>
              {!community.is_public && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
          </div>
        </div>

        {community.description && (
          <p className="text-sm text-muted-foreground mb-4">{community.description}</p>
        )}

        {/* Join/Leave Button */}
        {!isOwner && (
          <div className="mb-4">
            {isMember ? (
              <Button variant="outline" onClick={handleLeave} className="w-full">
                Leave Community
              </Button>
            ) : (
              <Button onClick={handleJoin} disabled={joining} className="w-full">
                {joining ? "Joining..." : "Join Community"}
              </Button>
            )}
          </div>
        )}

        <Separator className="my-4" />

        {/* Create Post */}
        {canPost && currentUserId && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <Textarea
                placeholder="Share something with the community..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="mb-3 min-h-20"
              />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" disabled>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
                <Button 
                  onClick={handleCreatePost} 
                  disabled={!newPost.trim() || posting}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {posting ? "Posting..." : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground">Be the first to share something!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className={post.is_pinned ? "border-primary/50" : ""}>
                <CardContent className="p-4">
                  {post.is_pinned && (
                    <div className="flex items-center gap-1 text-xs text-primary mb-2">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author?.profile_image || undefined} />
                      <AvatarFallback>
                        {post.author?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{post.author?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {(isOwner || post.author_id === currentUserId) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isOwner && (
                                <DropdownMenuItem>
                                  <Pin className="h-4 w-4 mr-2" />
                                  {post.is_pinned ? "Unpin" : "Pin"} Post
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive">
                                Delete Post
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap">{post.content}</p>
                      
                      {post.images && post.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {post.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt=""
                              className="rounded-lg object-cover w-full h-32"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                          {post.likes_count}
                        </button>
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                          <MessageCircle className="h-4 w-4" />
                          {post.comments_count}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
