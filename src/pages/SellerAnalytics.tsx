import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, MousePointer, MessageSquare, Star, TrendingUp, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface ProductStats {
  id: string;
  title: string;
  views: number;
  impressions: number;
  likes: number;
  discount: number;
}

export default function SellerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [activeDiscounts, setActiveDiscounts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAndFetch();
  }, []);

  const checkUserAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, rating")
      .eq("id", session.user.id)
      .single();

    if (profile?.user_type !== "seller") {
      navigate("/");
      return;
    }

    setAvgRating(profile.rating || 0);
    await fetchAnalytics(session.user.id);
  };

  const fetchAnalytics = async (userId: string) => {
    // Fetch products
    const { data: productsData } = await supabase
      .from("products")
      .select("id, title, views, impressions, likes, discount, discount_expiry")
      .eq("seller_id", userId);

    if (productsData) {
      setProducts(productsData);
      setTotalViews(productsData.reduce((sum, p) => sum + (p.views || 0), 0));
      setTotalImpressions(productsData.reduce((sum, p) => sum + (p.impressions || 0), 0));
      
      const now = new Date();
      const discounted = productsData.filter(p => 
        p.discount > 0 && (!p.discount_expiry || new Date(p.discount_expiry) > now)
      );
      setActiveDiscounts(discounted.length);
    }

    // Fetch comments count
    const { count: commentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", userId);
    
    setTotalComments(commentsCount || 0);

    // Fetch weekly analytics from product_analytics
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const productIds = productsData?.map(p => p.id) || [];
    
    if (productIds.length > 0) {
      const { data: analyticsData } = await supabase
        .from("product_analytics")
        .select("type, created_at")
        .in("product_id", productIds)
        .gte("created_at", weekAgo.toISOString());

      if (analyticsData) {
        // Group by day
        const dailyStats: { [key: string]: { views: number; impressions: number } } = {};
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const key = date.toLocaleDateString('en-US', { weekday: 'short' });
          dailyStats[key] = { views: 0, impressions: 0 };
        }

        analyticsData.forEach(item => {
          const date = new Date(item.created_at);
          const key = date.toLocaleDateString('en-US', { weekday: 'short' });
          if (dailyStats[key]) {
            if (item.type === 'view') dailyStats[key].views++;
            if (item.type === 'impression') dailyStats[key].impressions++;
          }
        });

        setWeeklyData(Object.entries(dailyStats).map(([name, data]) => ({
          name,
          views: data.views,
          impressions: data.impressions
        })));
      }
    }

    setLoading(false);
  };

  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const topProducts = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate("/seller")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold ml-4">Your Analytics</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalComments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)} ⭐</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Performance Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#f97316" strokeWidth={2} name="Views" />
                <Line type="monotone" dataKey="impressions" stroke="#22c55e" strokeWidth={2} name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Views</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="title" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Discounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Active Discounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-primary">{activeDiscounts}</div>
                <p className="text-muted-foreground mt-2">Products with active discounts</p>
              </div>
              {products.filter(p => p.discount > 0).length > 0 && (
                <div className="mt-4 space-y-2">
                  {products.filter(p => p.discount > 0).slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="truncate">{p.title}</span>
                      <span className="text-primary font-medium">-{p.discount}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
