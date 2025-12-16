import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Package, Eye, MousePointer, TrendingUp, MessageSquare, Percent, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersWeek: 0,
    totalProducts: 0,
    totalOpportunities: 0,
    totalComments: 0,
    totalViews: 0,
    totalImpressions: 0,
    activeDiscounts: 0,
    expiringOpportunities: 0,
    reports: 0
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
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
      { count: reportsCount }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("opportunities").select("*", { count: "exact", head: true }),
      supabase.from("comments").select("*", { count: "exact", head: true }),
      supabase.from("admin_messages").select("*", { count: "exact", head: true })
    ]);

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

    setStats({
      totalUsers: usersCount || 0,
      newUsersWeek: newUsers || 0,
      totalProducts: productsCount || 0,
      totalOpportunities: opportunitiesCount || 0,
      totalComments: commentsCount || 0,
      totalViews,
      totalImpressions,
      activeDiscounts,
      expiringOpportunities: expiringOps || 0,
      reports: reportsCount || 0
    });

    // Category distribution
    setCategoryData(
      Object.entries(categoryStats)
        .map(([name, value]) => ({ name: name.slice(0, 15), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    // Weekly analytics
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

    setWeeklyData(Object.entries(dailyStats).map(([name, data]) => ({
      name,
      views: data.views,
      impressions: data.impressions
    })));

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

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold ml-4">Platform Analytics</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                  <p className="text-xs text-muted-foreground">{stats.totalOpportunities} opportunities</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Traffic</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#f97316" strokeWidth={2} />
                      <Line type="monotone" dataKey="impressions" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
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

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="title" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#f97316" name="Views" />
                    <Bar dataKey="impressions" fill="#22c55e" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement">
            <div className="grid gap-4 md:grid-cols-3 mb-8">
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
                  <CardTitle className="text-sm font-medium">User Reports</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.reports}</div>
                </CardContent>
              </Card>
            </div>
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
