import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, MessageSquare, Heart, Share2, MoreHorizontal, 
  Plus, Search, Loader2, Crown, UserPlus, Settings,
  Image as ImageIcon, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Helmet } from "react-helmet";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  logo_image: string | null;
  member_count: number;
  seller_id: string;
  is_public: boolean;
  profiles?: {
    full_name: string;
    business_name: string | null;
    profile_image: string | null;
  };
}

interface CommunityPost {
  id: string;
  content: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  community_id: string;
  author_id: string;
  profiles?: {
    full_name: string;
    profile_image: string | null;
  };
  communities?: {
    name: string;
  };
}

export default function Community() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("discover");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    checkUser();
    loadCommunities();
    loadPosts();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .maybeSingle();
      setIsSeller(profile?.user_type === "seller");
      loadMyCommunities(session.user.id);
    }
  };

  const loadCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from("communities")
        .select(`
          *,
          profiles:seller_id (
            full_name,
            business_name,
            profile_image
          )
        `)
        .eq("is_public", true)
        .order("member_count", { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error("Error loading communities:", error);
    }
  };

  const loadMyCommunities = async (uid: string) => {
    try {
      // Get communities user owns or is member of
      const { data: memberData } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", uid);

      const memberCommunityIds = memberData?.map(m => m.community_id) || [];

      const { data: owned } = await supabase
        .from("communities")
        .select(`
          *,
          profiles:seller_id (
            full_name,
            business_name,
            profile_image
          )
        `)
        .eq("seller_id", uid);

      const { data: joined } = await supabase
        .from("communities")
        .select(`
          *,
          profiles:seller_id (
            full_name,
            business_name,
            profile_image
          )
        `)
        .in("id", memberCommunityIds);

      const allMyCommunities = [...(owned || []), ...(joined || [])];
      const uniqueCommunities = allMyCommunities.filter((c, i, arr) => 
        arr.findIndex(x => x.id === c.id) === i
      );
      setMyCommunities(uniqueCommunities);
    } catch (error) {
      console.error("Error loading my communities:", error);
    }
  };

  const loadPosts = async () => {
    try {
      // First get posts
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select(`*, communities:community_id (name)`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (postsError) throw postsError;
      
      // Then fetch author profiles separately
      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(p => p.author_id))];
        const { data: profilesData } = await supabase
          .from("public_profiles")
          .select("id, full_name, profile_image")
          .in("id", authorIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profilesMap.get(post.author_id) || { full_name: "User", profile_image: null }
        }));
        
        setPosts(postsWithProfiles as CommunityPost[]);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!userId) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to join communities.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: communityId, user_id: userId });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already a member", description: "You're already in this community." });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: "Joined!", description: "You've joined the community." });
      loadCommunities();
      loadMyCommunities(userId);
    } catch (error) {
      console.error("Error joining community:", error);
      toast({ title: "Error", description: "Failed to join community.", variant: "destructive" });
    }
  };

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Community - Smart Market</title>
        <meta name="description" content="Join seller communities, connect with others, and discover the latest updates." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 pb-24">
        <Navbar />

        <main className="pt-[120px] md:pt-20">
          <div className="container mx-auto px-4 lg:px-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                  <Users className="h-7 w-7 text-primary" />
                  Community
                </h1>
                <p className="text-muted-foreground mt-1">Connect, share, and grow together</p>
              </div>
              {isSeller && (
                <Link to="/seller/community/create">
                  <Button className="rounded-xl gap-2 shadow-lg">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create Community</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-muted/50 border-0"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 p-1 rounded-2xl w-full sm:w-auto">
                <TabsTrigger value="discover" className="rounded-xl flex-1 sm:flex-none gap-2">
                  <Users className="h-4 w-4" />
                  Discover
                </TabsTrigger>
                <TabsTrigger value="feed" className="rounded-xl flex-1 sm:flex-none gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Feed
                </TabsTrigger>
                <TabsTrigger value="my" className="rounded-xl flex-1 sm:flex-none gap-2">
                  <Crown className="h-4 w-4" />
                  My Communities
                </TabsTrigger>
              </TabsList>

              {/* Discover Tab */}
              <TabsContent value="discover" className="mt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredCommunities.length === 0 ? (
                  <div className="text-center py-12 glass-card">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No communities found</p>
                    {isSeller && (
                      <Link to="/seller/community/create">
                        <Button variant="outline" className="mt-4 rounded-xl">
                          Create the first one!
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCommunities.map((community) => (
                      <CommunityCard 
                        key={community.id} 
                        community={community}
                        onJoin={() => handleJoinCommunity(community.id)}
                        isMember={myCommunities.some(c => c.id === community.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Feed Tab */}
              <TabsContent value="feed" className="mt-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 glass-card">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No posts yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Join a community to see posts here</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </TabsContent>

              {/* My Communities Tab */}
              <TabsContent value="my" className="mt-6">
                {!userId ? (
                  <div className="text-center py-12 glass-card">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">Sign in to see your communities</p>
                    <Link to="/auth">
                      <Button className="rounded-xl">Sign In</Button>
                    </Link>
                  </div>
                ) : myCommunities.length === 0 ? (
                  <div className="text-center py-12 glass-card">
                    <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">You haven't joined any communities yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 rounded-xl"
                      onClick={() => setActiveTab("discover")}
                    >
                      Discover Communities
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myCommunities.map((community) => (
                      <CommunityCard 
                        key={community.id} 
                        community={community}
                        isMember={true}
                        isOwner={community.seller_id === userId}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}

function CommunityCard({ 
  community, 
  onJoin, 
  isMember = false,
  isOwner = false 
}: { 
  community: Community; 
  onJoin?: () => void;
  isMember?: boolean;
  isOwner?: boolean;
}) {
  return (
    <div className="glass-card-hover overflow-hidden group">
      {/* Cover */}
      <div className="h-24 bg-gradient-to-br from-primary/30 via-info/20 to-primary/10 relative">
        {community.cover_image && (
          <img 
            src={community.cover_image} 
            alt={community.name} 
            className="w-full h-full object-cover"
          />
        )}
        {isOwner && (
          <Link 
            to={`/seller/community/${community.id}/settings`}
            className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        )}
      </div>
      
      {/* Logo */}
      <div className="relative px-4">
        <div className="absolute -top-8 left-4 w-16 h-16 rounded-2xl border-4 border-background bg-gradient-to-br from-primary to-primary-dark overflow-hidden shadow-lg">
          {community.logo_image ? (
            <img src={community.logo_image} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-foreground text-xl font-bold">
              {community.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 pt-10 pb-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{community.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {community.description || "Welcome to our community!"}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{community.member_count} members</span>
          </div>
          
          {isMember ? (
            <Link to={`/community/${community.id}`}>
              <Button size="sm" variant="outline" className="rounded-xl gap-1">
                View <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" className="rounded-xl gap-1" onClick={onJoin}>
              <UserPlus className="h-3.5 w-3.5" />
              Join
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: CommunityPost }) {
  const [isLiked, setIsLiked] = useState(false);
  const timeAgo = getTimeAgo(post.created_at);

  return (
    <article className="glass-card p-5 space-y-4">
      {/* Author */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground font-semibold overflow-hidden">
            {post.profiles?.profile_image ? (
              <img src={post.profiles.profile_image} alt="" className="w-full h-full object-cover" />
            ) : (
              post.profiles?.full_name?.charAt(0) || "U"
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">{post.profiles?.full_name}</p>
            <p className="text-xs text-muted-foreground">
              in <span className="text-primary">{post.communities?.name}</span> • {timeAgo}
            </p>
          </div>
        </div>
        <button className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <p className="text-foreground">{post.content}</p>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
          {post.images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="aspect-square relative">
              <img src={img} alt="" className="w-full h-full object-cover" />
              {idx === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center text-lg font-semibold">
                  +{post.images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            isLiked 
              ? "text-destructive bg-destructive/10" 
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">{post.likes_count + (isLiked ? 1 : 0)}</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">{post.comments_count}</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <Share2 className="h-5 w-5" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>
    </article>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}