import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationBell } from "@/components/NotificationBell";
import { 
  Package, Eye, Heart, TrendingUp, LayoutDashboard, 
  ArrowLeft, LogOut, BarChart3, User, Users, Megaphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

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
            Seller Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Welcome, {profile?.business_name || profile?.full_name}!
              </h2>
              <p className="text-sm opacity-90">Manage your products and track performance</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Products</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalProducts}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Views</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.totalViews}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Likes</p>
                  <p className="text-2xl font-bold text-red-500">{stats.totalLikes}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Rating</p>
                  <p className="text-2xl font-bold text-yellow-500">{profile?.rating || 0}⭐</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/seller/products" className="block">
            <Card className="h-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">My Products</h3>
                  <p className="text-xs text-muted-foreground">Manage listings</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/seller/analytics" className="block">
            <Card className="h-full bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Analytics</h3>
                  <p className="text-xs text-muted-foreground">View insights</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/seller/referrals" className="block">
            <Card className="h-full bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">My Referrals</h3>
                  <p className="text-xs text-muted-foreground">Invite & earn</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/seller/marketing" className="block">
            <Card className="h-full bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Megaphone className="h-7 w-7 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Marketing</h3>
                  <p className="text-xs text-muted-foreground">Promotions</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}