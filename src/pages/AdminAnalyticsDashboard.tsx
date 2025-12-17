import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Package, Eye, MousePointer, TrendingUp, MessageSquare, Percent, AlertTriangle, ShoppingBag, Store, Megaphone, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";

export default function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersWeek: 0,
    totalBuyers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOpportunities: 0,
    totalComments: 0,
    totalViews: 0,
    totalImpressions: 0,
    activeDiscounts: 0,
    expiringOpportunities: 0,
    reports: 0,
    totalMarketingPosts: 0,
    activeAds: 0,
    previousWeekViews: 0
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [userActivityData, setUserActivityData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
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

    await fetchAllStats();
  };

  const fetchAllStats = async () => {
    // Basic counts
    const [
      { count: usersCount },
      { count: productsCount },
      { count: opportunitiesCount },
      { count: commentsCount },
      { count: reportsCount },
      { count: marketingCount },
      { count: adsCount }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("opportunities").select("*", { count: "exact", head: true }),
      supabase.from("comments").select("*", { count: "exact", head: true }),
      supabase.from("admin_messages").select("*", { count: "exact", head: true }),
      supabase.from("marketing_posts").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("ads").select("*", { count: "exact", head: true }).eq("is_active", true)
    ]);

    // Count buyers and sellers
    const { data: userTypeData } = await supabase
      .from("profiles")
      .select("user_type");

    let buyerCount = 0;
    let sellerCount = 0;
    if (userTypeData) {
      userTypeData.forEach(u => {
        if (u.user_type === 'buyer') buyerCount++;
        if (u.user_type === 'seller') sellerCount++;
      });
    }

    // New users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // Total views and impressions
    const { data: productsData } = await supabase
      .from("products")
      .select("views, impressions, category, discount, discount_expiry");

    let totalViews = 0;
    let totalImpressions = 0;
    let activeDiscounts = 0;
    const categoryStats: { [key: string]: number } = {};

    if (productsData) {
      productsData.forEach(p => {
        totalViews += p.views || 0;
        totalImpressions += p.impressions || 0;
        if (p.discount > 0 && (!p.discount_expiry || new Date(p.discount_expiry) > new Date())) {
          activeDiscounts++;
        }
        if (p.category) {
          categoryStats[p.category] = (categoryStats[p.category] || 0) + 1;
        }
      });
    }

    // Expiring opportunities
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const { count: expiringOps } = await supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .lte("expire_date", threeDaysFromNow.toISOString())
      .gte("expire_date", new Date().toISOString());

    // Previous week analytics for comparison
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const { data: prevWeekAnalytics } = await supabase
      .from("product_analytics")
      .select("type")
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", weekAgo.toISOString());

    const previousWeekViews = prevWeekAnalytics?.filter(a => a.type === 'view').length || 0;

    setStats({
      totalUsers: usersCount || 0,
      newUsersWeek: newUsers || 0,
      totalBuyers: buyerCount,
      totalSellers: sellerCount,
      totalProducts: productsCount || 0,
      totalOpportunities: opportunitiesCount || 0,
      totalComments: commentsCount || 0,
      totalViews,
      totalImpressions,
      activeDiscounts,
      expiringOpportunities: expiringOps || 0,
      reports: reportsCount || 0,
      totalMarketingPosts: marketingCount || 0,
      activeAds: adsCount || 0,
      previousWeekViews
    });

    // Category distribution
    setCategoryData(
      Object.entries(categoryStats)
        .map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 12) + '...' : name, value, fullName: name }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    // Trending categories (by views)
    const { data: categoryViews } = await supabase
      .from("products")
      .select("category, views");

    const categoryViewStats: { [key: string]: number } = {};
    if (categoryViews) {
      categoryViews.forEach(p => {
        if (p.category) {
          categoryViewStats[p.category] = (categoryViewStats[p.category] || 0) + (p.views || 0);
        }
      });
    }

    setTrendingCategories(
      Object.entries(categoryViewStats)
        .map(([name, views]) => ({ name, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
    );

    // Weekly user activity
    const { data: analyticsData } = await supabase
      .from("product_analytics")
      .select("type, created_at")
      .gte("created_at", weekAgo.toISOString());

    const dailyStats: { [key: string]: { views: number; impressions: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('en-US', { weekday: 'short' });
      dailyStats[key] = { views: 0, impressions: 0 };
    }

    if (analyticsData) {
      analyticsData.forEach(item => {
        const date = new Date(item.created_at);
        const key = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (dailyStats[key]) {
          if (item.type === 'view') dailyStats[key].views++;
          if (item.type === 'impression') dailyStats[key].impressions++;
        }
      });
    }

    setUserActivityData(Object.entries(dailyStats).map(([name, data]) => ({
      name,
      views: data.views,
      impressions: data.impressions
    })));

    // User growth data (last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const { data: usersCreated } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", monthAgo.toISOString());

    const userGrowth: { [key: string]: number } = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      userGrowth[key] = 0;
    }

    if (usersCreated) {
      usersCreated.forEach(user => {
        const date = new Date(user.created_at);
        const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (userGrowth[key] !== undefined) {
          userGrowth[key]++;
        }
      });
    }

    // Calculate cumulative
    let cumulative = usersCount || 0;
    const growthData = Object.entries(userGrowth).reverse().map(([name, count]) => {
      cumulative -= count;
      return { name, users: cumulative + count };
    }).reverse();

    setUserGrowthData(growthData.filter((_, i) => i % 5 === 0 || i === growthData.length - 1));

    // Top products
    const { data: topProductsData } = await supabase
      .from("products")
      .select("id, title, views, impressions, likes")
      .order("views", { ascending: false })
      .limit(5);

    setTopProducts(topProductsData || []);
    setLoading(false);
  };

  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const currentWeekViews = userActivityData.reduce((sum, d) => sum + d.views, 0);
  const viewsGrowth = stats.previousWeekViews > 0 
    ? ((currentWeekViews - stats.previousWeekViews) / stats.previousWeekViews * 100).toFixed(1)
    : 0;
  const isPositiveGrowth = Number(viewsGrowth) >= 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold ml-4">Platform Analytics</h1>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Main Stats Grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-green-500">+{stats.newUsersWeek} this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{stats.activeDiscounts} with discounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
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
                  <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Product impressions</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Weekly Traffic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={userActivityData}>
                      <defs>
                        <linearGradient id="colorViewsAdmin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorClicksAdmin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="views" stroke="#f97316" fillOpacity={1} fill="url(#colorViewsAdmin)" name="Views" />
                      <Area type="monotone" dataKey="impressions" stroke="#22c55e" fillOpacity={1} fill="url(#colorClicksAdmin)" name="Clicks" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Products by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name }) => name}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Products & Trending Categories */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="title" 
                        type="category" 
                        width={120} 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => value.length > 18 ? value.slice(0, 18) + '...' : value}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#f97316" name="Views" />
                      <Bar dataKey="impressions" fill="#22c55e" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendingCategories.map((cat, index) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{cat.views.toLocaleString()} views</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            {/* User Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBuyers.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
                  <Store className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSellers.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">New This Week</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">+{stats.newUsersWeek}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Seller Ratio</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalUsers > 0 ? ((stats.totalSellers / stats.totalUsers) * 100).toFixed(1) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  User Growth (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Total Users" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Comments</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalComments}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeDiscounts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Marketing Posts</CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMarketingPosts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeAds}</div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary">{stats.totalViews.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground mt-1">Total Product Views</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-500">{stats.totalImpressions.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground mt-1">Total Product Clicks</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-500">
                      {stats.totalViews > 0 ? ((stats.totalImpressions / stats.totalViews) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Click-Through Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className={stats.expiringOpportunities > 0 ? 'border-yellow-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Expiring Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.expiringOpportunities}</div>
                  <p className="text-muted-foreground mt-2">
                    Opportunities expiring in the next 3 days
                  </p>
                </CardContent>
              </Card>

              <Card className={stats.reports > 0 ? 'border-red-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Pending Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.reports}</div>
                  <p className="text-muted-foreground mt-2">
                    User reports requiring attention
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
