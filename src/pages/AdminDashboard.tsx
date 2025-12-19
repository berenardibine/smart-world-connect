import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Package, ShoppingCart, Briefcase, ArrowLeft, LogOut, 
  MessageSquare, Image, Bell, BarChart3, Settings, Megaphone, Shield
} from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSellers: 0,
    totalBuyers: 0,
  });
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
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

    setIsAdmin(true);
    await fetchStats();
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: sellersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "seller");

    const { count: buyersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "buyer");

    setStats({
      totalUsers: usersCount || 0,
      totalProducts: productsCount || 0,
      totalSellers: sellersCount || 0,
      totalBuyers: buyersCount || 0,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const menuItems = [
    { icon: Users, label: "Users", desc: "Manage users", to: "/admin/users", color: "blue" },
    { icon: Package, label: "Products", desc: "All products", to: "/admin/products", color: "green" },
    { icon: Briefcase, label: "Opportunities", desc: "Jobs & internships", to: "/admin/opportunities", color: "purple" },
    { icon: Megaphone, label: "Marketing", desc: "Promotions", to: "/admin/marketing", color: "orange" },
    { icon: Bell, label: "Notifications", desc: "Send alerts", to: "/admin/notifications", color: "red" },
    { icon: BarChart3, label: "Analytics", desc: "View stats", to: "/admin/analytics", color: "cyan" },
    { icon: MessageSquare, label: "Messages", desc: "Contact inbox", to: "/admin/messages", color: "pink" },
    { icon: Image, label: "Smart Ads", desc: "Manage ads", to: "/admin/ads", color: "indigo" },
    { icon: Settings, label: "Settings", desc: "Configure", to: "/admin/settings", color: "gray" },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string }> = {
      blue: { bg: "bg-blue-500/10", icon: "text-blue-500", border: "border-blue-500/20" },
      green: { bg: "bg-green-500/10", icon: "text-green-500", border: "border-green-500/20" },
      purple: { bg: "bg-purple-500/10", icon: "text-purple-500", border: "border-purple-500/20" },
      orange: { bg: "bg-orange-500/10", icon: "text-orange-500", border: "border-orange-500/20" },
      red: { bg: "bg-red-500/10", icon: "text-red-500", border: "border-red-500/20" },
      cyan: { bg: "bg-cyan-500/10", icon: "text-cyan-500", border: "border-cyan-500/20" },
      pink: { bg: "bg-pink-500/10", icon: "text-pink-500", border: "border-pink-500/20" },
      indigo: { bg: "bg-indigo-500/10", icon: "text-indigo-500", border: "border-indigo-500/20" },
      gray: { bg: "bg-gray-500/10", icon: "text-gray-500", border: "border-gray-500/20" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Admin Badge */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin Dashboard</h2>
              <p className="text-sm opacity-90">Rwanda Smart Market Management</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Users</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.totalUsers}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Products</p>
                  <p className="text-2xl font-bold text-green-500">{stats.totalProducts}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Sellers</p>
                  <p className="text-2xl font-bold text-purple-500">{stats.totalSellers}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Buyers</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.totalBuyers}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-3">
          {menuItems.map((item) => {
            const colors = getColorClasses(item.color);
            return (
              <Link key={item.to} to={item.to} className="block">
                <Card className={`h-full ${colors.border} hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group`}>
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                    <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <item.icon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">{item.label}</h3>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}