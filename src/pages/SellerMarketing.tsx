import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, TrendingUp, Eye, MousePointer, BarChart3, Megaphone, Rocket, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface MarketingPost {
  id: string;
  title: string;
  content: string;
  post_type: string;
  duration: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: string;
  impressions: number;
  clicks: number;
  conversion_score: number;
  images: string[];
  product_id: string | null;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  images: string[];
}

const SellerMarketing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    post_type: "marketing",
    duration: "week",
    product_id: ""
  });

  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgEngagement: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      // Verify seller
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();

      if (profile?.user_type !== "seller") {
        toast.error("Only sellers can access marketing");
        navigate("/");
        return;
      }

      // Fetch marketing posts
      const { data: postsData } = await supabase
        .from("marketing_posts")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (postsData) {
        setPosts(postsData as MarketingPost[]);
        
        // Calculate stats
        const totalImpressions = postsData.reduce((sum, p) => sum + (p.impressions || 0), 0);
        const totalClicks = postsData.reduce((sum, p) => sum + (p.clicks || 0), 0);
        
        setStats({
          totalPosts: postsData.length,
          activePosts: postsData.filter(p => p.is_active && p.status === "active").length,
          totalImpressions,
          totalClicks,
          avgEngagement: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 100) : 0
        });
      }

      // Fetch seller's products for boosting
      const { data: productsData } = await supabase
        .from("products")
        .select("id, title, images")
        .eq("seller_id", user.id)
        .eq("status", "approved");

      if (productsData) {
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = (duration: string): string => {
    const now = new Date();
    switch (duration) {
      case "day":
        now.setDate(now.getDate() + 1);
        break;
      case "week":
        now.setDate(now.getDate() + 7);
        break;
      case "month":
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        now.setDate(now.getDate() + 7);
    }
    return now.toISOString();
  };

  const handleCreatePost = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const endDate = calculateEndDate(formData.duration);
      
      const { error } = await supabase
        .from("marketing_posts")
        .insert({
          seller_id: userId,
          title: formData.title,
          content: formData.content,
          post_type: formData.post_type,
          duration: formData.duration,
          start_date: new Date().toISOString(),
          end_date: endDate,
          product_id: formData.product_id || null,
          status: "pending",
          is_active: false,
          admin_id: userId // Required field
        });

      if (error) throw error;

      toast.success("Marketing post created! Awaiting admin approval.");
      setDialogOpen(false);
      setFormData({ title: "", content: "", post_type: "marketing", duration: "week", product_id: "" });
      fetchData();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-24">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Marketing & Promotions</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Marketing Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter post title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Describe your promotion..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={formData.post_type}
                    onValueChange={(value) => setFormData({ ...formData, post_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing Post</SelectItem>
                      <SelectItem value="boost">Product Boost</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.post_type === "boost" && (
                  <div>
                    <label className="text-sm font-medium">Select Product to Boost</label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">1 Day</SelectItem>
                      <SelectItem value="week">1 Week</SelectItem>
                      <SelectItem value="month">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreatePost} disabled={isCreating} className="w-full">
                  {isCreating ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                  <p className="text-xs text-muted-foreground">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Rocket className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activePosts}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalImpressions}</p>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-full">
                  <MousePointer className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalClicks}</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-full">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgEngagement}%</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts List */}
        <Card>
          <CardHeader>
            <CardTitle>My Marketing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No marketing posts yet</p>
                <p className="text-sm">Create your first post to promote your products!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 bg-muted/50 rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                      </div>
                      {getStatusBadge(post.status, post.is_active)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.impressions || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointer className="h-4 w-4" />
                        {post.clicks || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {post.impressions > 0 ? Math.round((post.clicks / post.impressions) * 100) : 0}%
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.duration}
                      </div>
                    </div>
                    {post.end_date && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(post.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
};

export default SellerMarketing;
