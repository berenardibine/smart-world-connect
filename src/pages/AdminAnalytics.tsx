import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Users, Package, Eye, Heart, ShoppingCart } from "lucide-react";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalProducts: 0,
    totalViews: 0,
    totalLikes: 0,
    activeUsers: 0,
    blockedUsers: 0,
    bannedUsers: 0,
    approvedProducts: 0,
    pendingProducts: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      navigate("/");
      return;
    }

    await fetchAnalytics();
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    // Fetch user stats
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalSellers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "seller");

    const { count: totalBuyers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "buyer");

    const { count: activeUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: blockedUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "blocked");

    const { count: bannedUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "banned");

    // Fetch product stats
    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: approvedProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    const { count: pendingProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Fetch views and likes
    const { data: productData } = await supabase
      .from("products")
      .select("views, likes");

    const totalViews = productData?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
    const totalLikes = productData?.reduce((sum, p) => sum + (p.likes || 0), 0) || 0;

    setAnalytics({
      totalUsers: totalUsers || 0,
      totalSellers: totalSellers || 0,
      totalBuyers: totalBuyers || 0,
      totalProducts: totalProducts || 0,
      totalViews,
      totalLikes,
      activeUsers: activeUsers || 0,
      blockedUsers: blockedUsers || 0,
      bannedUsers: bannedUsers || 0,
      approvedProducts: approvedProducts || 0,
      pendingProducts: pendingProducts || 0,
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Analytics Dashboard</h1>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalSellers} sellers, {analytics.totalBuyers} buyers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.blockedUsers} blocked, {analytics.bannedUsers} banned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.approvedProducts} approved, {analytics.pendingProducts} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalViews}</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalLikes}</div>
              <p className="text-xs text-muted-foreground">Product engagement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Views/Product</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalProducts > 0 
                  ? Math.round(analytics.totalViews / analytics.totalProducts)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">Product visibility</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
