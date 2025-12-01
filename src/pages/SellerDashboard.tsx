import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationBell } from "@/components/NotificationBell";
import { Package, Eye, Heart, TrendingUp, LayoutDashboard, User, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Badge } from "@/components/ui/badge";

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const { plan, activity, loading: planLoading } = useUserPlan(userId);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData?.user_type !== "seller") {
      navigate("/");
      return;
    }

    setProfile(profileData);
    setUserId(session.user.id);
    await fetchStats(session.user.id);
    setLoading(false);
  };

  const fetchStats = async (userId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("views, likes")
      .eq("seller_id", userId);

    if (!error && data) {
      const totalViews = data.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalLikes = data.reduce((sum, p) => sum + (p.likes || 0), 0);

      setStats({
        totalProducts: data.length,
        totalViews,
        totalLikes,
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <div className="flex items-center gap-2">
            <Link to="/account">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <NotificationBell />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Active listings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">Product impressions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">Product favorites</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.rating || 0}⭐</div>
              <p className="text-xs text-muted-foreground">
                {profile?.rating_count || 0} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {plan && !planLoading && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Your Plan: {plan.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.price_rwf === 0 ? 'Free Plan' : `${plan.price_rwf.toLocaleString()} RWF / month`}
                  </p>
                </div>
                <Link to="/seller/plans">
                  <Button variant="outline" size="sm">
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Posts This Month</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-bold">{activity.posts_this_month}</p>
                    <p className="text-muted-foreground">
                      / {plan.post_limit_monthly === -1 ? '∞' : plan.post_limit_monthly}
                    </p>
                  </div>
                  {plan.post_limit_monthly !== -1 && activity.posts_this_month >= plan.post_limit_monthly && (
                    <Badge variant="destructive" className="mt-1">Limit reached</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Updates This Month</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-bold">{activity.updates_this_month}</p>
                    <p className="text-muted-foreground">
                      / {plan.updates_limit_monthly === -1 ? '∞' : plan.updates_limit_monthly}
                    </p>
                  </div>
                  {plan.updates_limit_monthly !== -1 && activity.updates_this_month >= plan.updates_limit_monthly && (
                    <Badge variant="destructive" className="mt-1">Limit reached</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Product Edits</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-bold">{activity.edits_this_month}</p>
                  </div>
                  {!plan.can_edit_product && (
                    <Badge variant="secondary" className="mt-1">Upgrade to edit</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Manage Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                View and manage all your product listings
              </p>
              <Link to="/seller/products">
                <Button className="w-full">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Products
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Share news, promotions, and updates with your customers
              </p>
              <Link to="/seller/updates">
                <Button className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  Create Update
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post Opportunity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                List job opportunities for your company
              </p>
              <Link to="/post-opportunity">
                <Button className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  Post Opportunity
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
