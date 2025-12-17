import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, MousePointer, MessageSquare, Star, TrendingUp, Percent, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";

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
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [activeDiscounts, setActiveDiscounts] = useState(0);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [previousPeriodViews, setPreviousPeriodViews] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
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
      .select("user_type, rating, rating_count")
      .eq("id", session.user.id)
      .single();

    if (profile?.user_type !== "seller") {
      navigate("/");
      return;
    }

    setAvgRating(profile.rating || 0);
    setRatingCount(profile.rating_count || 0);
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

    const productIds = productsData?.map(p => p.id) || [];
    
    if (productIds.length > 0) {
      // Fetch weekly analytics
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: analyticsData } = await supabase
        .from("product_analytics")
        .select("type, created_at")
        .in("product_id", productIds)
        .gte("created_at", weekAgo.toISOString());

      if (analyticsData) {
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

      // Fetch monthly analytics
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const { data: monthlyAnalytics } = await supabase
        .from("product_analytics")
        .select("type, created_at")
        .in("product_id", productIds)
        .gte("created_at", monthAgo.toISOString());

      if (monthlyAnalytics) {
        const weeklyStats: { [key: string]: { views: number; impressions: number } } = {};
        
        for (let i = 3; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - (i * 7));
          const key = `Week ${4 - i}`;
          weeklyStats[key] = { views: 0, impressions: 0 };
        }

        monthlyAnalytics.forEach(item => {
          const date = new Date(item.created_at);
          const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
          const weekNum = Math.min(3, Math.floor(daysAgo / 7));
          const key = `Week ${4 - weekNum}`;
          if (weeklyStats[key]) {
            if (item.type === 'view') weeklyStats[key].views++;
            if (item.type === 'impression') weeklyStats[key].impressions++;
          }
        });

        setMonthlyData(Object.entries(weeklyStats).map(([name, data]) => ({
          name,
          views: data.views,
          impressions: data.impressions
        })));
      }

      // Calculate previous period views for comparison
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const { data: prevAnalytics } = await supabase
        .from("product_analytics")
        .select("type")
        .in("product_id", productIds)
        .gte("created_at", twoWeeksAgo.toISOString())
        .lt("created_at", weekAgo.toISOString());

      if (prevAnalytics) {
        setPreviousPeriodViews(prevAnalytics.filter(a => a.type === 'view').length);
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

  const currentPeriodViews = weeklyData.reduce((sum, d) => sum + d.views, 0);
  const viewsGrowth = previousPeriodViews > 0 
    ? ((currentPeriodViews - previousPeriodViews) / previousPeriodViews * 100).toFixed(1)
    : 0;
  const isPositiveGrowth = Number(viewsGrowth) >= 0;

  const chartData = timeRange === 'weekly' ? weeklyData : monthlyData;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate("/seller/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold ml-4">Your Analytics</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <div className={`flex items-center text-xs ${isPositiveGrowth ? 'text-green-500' : 'text-red-500'}`}>
                {isPositiveGrowth ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {viewsGrowth}% vs last week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Product impressions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalComments}</div>
              <p className="text-xs text-muted-foreground">Total reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)} ⭐</div>
              <p className="text-xs text-muted-foreground">{ratingCount} ratings</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart with Time Range Toggle */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Over Time
              </CardTitle>
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                <TabsList>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="views" stroke="#f97316" fillOpacity={1} fill="url(#colorViews)" name="Views" />
                <Area type="monotone" dataKey="impressions" stroke="#22c55e" fillOpacity={1} fill="url(#colorClicks)" name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Products by Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="title" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                    />
                    <Tooltip />
                    <Bar dataKey="views" fill="#f97316" name="Views" />
                    <Bar dataKey="impressions" fill="#22c55e" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No product data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Products Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total Products</span>
                  <span className="text-2xl font-bold">{products.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Active Discounts</span>
                  <span className="text-2xl font-bold text-primary">{activeDiscounts}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Avg Views/Product</span>
                  <span className="text-2xl font-bold">
                    {products.length > 0 ? Math.round(totalViews / products.length) : 0}
                  </span>
                </div>
              </div>
              
              {products.filter(p => p.discount > 0).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Discounted Products</h4>
                  <div className="space-y-2">
                    {products.filter(p => p.discount > 0).slice(0, 3).map(p => (
                      <div key={p.id} className="flex justify-between text-sm p-2 bg-primary/10 rounded">
                        <span className="truncate flex-1">{p.title}</span>
                        <span className="text-primary font-bold ml-2">-{p.discount}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
