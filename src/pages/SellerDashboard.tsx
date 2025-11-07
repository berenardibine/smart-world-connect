import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationBell } from "@/components/NotificationBell";
import { Package, Eye, Heart, TrendingUp, LayoutDashboard, User } from "lucide-react";
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
// src/pages/SellerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { getActivePlanForUser, getSellerActivity, requestPlanUpgrade } from '@/lib/api/supabasePlanApi';
import RequestPlanModal from '@/components/RequestPlanModal';
import { Button } from '@/components/ui/button';

const CURRENT_USER_ID = () => {
  // Replace with actual auth: supabase.auth.getUser() etc.
  // For demo, get from localStorage or set to a demo user id you created in supabase auth.
  return localStorage.getItem('rsm_demo_user_id') || '';
};

export const SellerDashboard: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);
  const [activity, setActivity] = useState<any>({ products_posted:0, updates_created:0 });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const uid = CURRENT_USER_ID();
    setUserId(uid);
    if (!uid) return;
    (async () => {
      const p = await getActivePlanForUser(uid);
      setPlan(p);
      const a = await getSellerActivity(uid);
      setActivity(a);
    })();
  }, []);

  const openRequest = () => setShowModal(true);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Seller Dashboard</h1>

      <div className="border rounded p-4 mb-4">
        <h2 className="text-lg font-semibold">Current Plan</h2>
        {plan ? (
          <div>
            <div className="font-bold">{plan.plans?.name || 'Active plan'}</div>
            <div className="text-sm text-muted-foreground">Status: {plan.status}</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No active paid plan. You are on Free plan by default.</div>
        )}
      </div>

      <div className="border rounded p-4 mb-4">
        <h2 className="text-lg font-semibold">This month activity</h2>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="p-3 border rounded">
            <div className="text-sm text-muted-foreground">Products posted</div>
            <div className="text-xl font-bold">{activity.products_posted ?? 0}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-muted-foreground">Updates created</div>
            <div className="text-xl font-bold">{activity.updates_created ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={openRequest} className="bg-orange-500 text-white">Request Plan Upgrade</Button>
        <a href="https://wa.me/250798751685?text=I%20want%20to%20pay%20for%20a%20Rwanda%20Smart%20Market%20plan" target="_blank" rel="noreferrer" className="inline-block">
          <Button variant="outline">Contact via WhatsApp</Button>
        </a>
      </div>

      {showModal && <RequestPlanModal userId={userId} onClose={() => setShowModal(false)} onSubmitted={async () => {
        setShowModal(false);
        // refresh
        const p = await getActivePlanForUser(userId);
        setPlan(p);
      }} />}
    </div>
  );
};
