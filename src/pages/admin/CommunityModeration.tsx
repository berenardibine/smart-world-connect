import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Shield, Search, Loader2, Trash2, 
  Eye, Ban, CheckCircle, AlertTriangle, MessageSquare,
  Crown, UserX, MoreHorizontal, Pin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

interface Community {
  id: string;
  name: string;
  description: string | null;
  logo_image: string | null;
  member_count: number;
  seller_id: string;
  is_public: boolean;
  is_pinned_by_admin: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface CommunityPost {
  id: string;
  content: string;
  community_id: string;
  author_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  communities?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface Report {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_id: string;
  community_id?: string;
  post_id?: string;
}

export default function CommunityModeration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("communities");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadCommunities(), loadPosts()]);
    setLoading(false);
  };

  const loadCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from("communities")
        .select(`
          *,
          profiles:seller_id (full_name, email)
        `)
        .order("is_pinned_by_admin", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error("Error loading communities:", error);
    }
  };

  const loadPosts = async () => {
    try {
      // Get posts with community info
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select(`*, communities:community_id (name)`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (postsError) throw postsError;

      // Fetch author profiles
      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(p => p.author_id))];
        const { data: profilesData } = await supabase
          .from("public_profiles")
          .select("id, full_name")
          .in("id", authorIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profilesMap.get(post.author_id) || { full_name: "Unknown" }
        }));
        
        setPosts(postsWithProfiles as CommunityPost[]);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    try {
      // Delete all members first
      await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId);

      // Delete all posts
      await supabase
        .from("community_posts")
        .delete()
        .eq("community_id", communityId);

      // Delete community
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", communityId);

      if (error) throw error;

      toast({ title: "Community deleted" });
      loadCommunities();
    } catch (error) {
      console.error("Error deleting community:", error);
      toast({ title: "Error deleting community", variant: "destructive" });
    }
  };

  const handlePinCommunity = async (communityId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("communities")
        .update({ is_pinned_by_admin: !isPinned })
        .eq("id", communityId);

      if (error) throw error;

      toast({ title: isPinned ? "Community unpinned" : "Community pinned" });
      loadCommunities();
    } catch (error) {
      console.error("Error pinning community:", error);
      toast({ title: "Error pinning community", variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      // Delete comments first
      await supabase
        .from("community_post_comments")
        .delete()
        .eq("post_id", postId);

      // Delete likes
      await supabase
        .from("community_post_likes")
        .delete()
        .eq("post_id", postId);

      // Delete post
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({ title: "Post deleted" });
      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error deleting post", variant: "destructive" });
    }
  };

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(p =>
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.communities?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Community Moderation - Admin - Smart World Connect</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg">Community Moderation</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{communities.length}</p>
                  <p className="text-sm text-muted-foreground">Communities</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-info/10">
                  <MessageSquare className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{posts.length}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{communities.filter(c => c.is_public).length}</p>
                  <p className="text-sm text-muted-foreground">Public</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{communities.filter(c => !c.is_public).length}</p>
                  <p className="text-sm text-muted-foreground">Private</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-muted/50 border-0"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 p-1 rounded-2xl mb-6">
              <TabsTrigger value="communities" className="rounded-xl gap-2">
                <Users className="h-4 w-4" />
                Communities ({filteredCommunities.length})
              </TabsTrigger>
              <TabsTrigger value="posts" className="rounded-xl gap-2">
                <MessageSquare className="h-4 w-4" />
                Posts ({filteredPosts.length})
              </TabsTrigger>
            </TabsList>

            {/* Communities Tab */}
            <TabsContent value="communities">
              <div className="glass-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Community</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommunities.map((community) => (
                      <TableRow key={community.id} className={community.is_pinned_by_admin ? "bg-primary/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={community.logo_image || undefined} />
                              <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{community.name}</p>
                                {community.is_pinned_by_admin && (
                                  <Pin className="h-3 w-3 text-primary" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {community.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{community.profiles?.full_name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{community.member_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={community.is_public ? "default" : "outline"}>
                            {community.is_public ? "Public" : "Private"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(community.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/community/${community.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePinCommunity(community.id, community.is_pinned_by_admin)}>
                                <Pin className="h-4 w-4 mr-2" />
                                {community.is_pinned_by_admin ? "Unpin" : "Pin"} Community
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Community?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{community.name}" and all its content.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteCommunity(community.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredCommunities.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No communities found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts">
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {post.communities?.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            by {post.profiles?.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-3">{post.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>❤️ {post.likes_count}</span>
                          <span>💬 {post.comments_count}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this post and all its comments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeletePost(post.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {filteredPosts.length === 0 && (
                  <div className="text-center py-12 glass-card">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No posts found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
