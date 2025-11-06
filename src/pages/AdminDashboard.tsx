import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Package, DollarSign, MessageSquare, ShoppingCart } from "lucide-react";

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

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
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
    // Fetch total users
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Fetch total products
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Fetch sellers count
    const { count: sellersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "seller");

    // Fetch buyers count
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
// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { mockApi } from "@/api/mockSubscriptionApi";
import type { SubscriptionRequest } from "@/types/subscription";

export const AdminDashboard: React.FC = () => {
  const [reqs, setReqs] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await mockApi.getRequests();
    setReqs(r);
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const review = async (id: string, approve: boolean) => {
    const admin = { name: 'Admin (Manual)' };
    const note = approve ? 'Approved manually' : 'Rejected manually';
    await mockApi.reviewRequest(id, admin, approve, note);
    await load();
    alert('Reviewed');
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Admin — Subscription Requests</h1>
      {loading ? <div>Loading...</div> : (
        <div className="mt-4 space-y-4">
          {reqs.length === 0 && <div className="text-sm text-muted-foreground">No requests yet.</div>}
          {reqs.map(r => (
            <div key={r.id} className="border rounded p-4 flex justify-between items-start">
              <div>
                <div className="font-semibold">{r.requestedPlan.toUpperCase()} - {r.amountFrw.toLocaleString()} FRW</div>
                <div className="text-sm text-muted-foreground">From user: {r.userId} • {new Date(r.createdAtISO).toLocaleString()}</div>
                <div className="mt-2 text-sm">{r.message}</div>
                <div className="mt-2 text-xs">Payment phone: {r.phonePaidTo} • Ref: {r.paymentReference || '—'}</div>
                <div className="mt-2 text-xs">Status: <strong>{r.status}</strong></div>
              </div>
              <div className="flex flex-col gap-2">
                {r.status === 'pending' ? <>
                  <button onClick={()=>review(r.id, true)} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
                  <button onClick={()=>review(r.id, false)} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
                </> : <div className="text-sm text-muted-foreground">Reviewed at {r.reviewedAtISO ? new Date(r.reviewedAtISO).toLocaleString() : '-'}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage Rwanda Smart Market</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">All registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Listed products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSellers}</div>
              <p className="text-xs text-muted-foreground">Active sellers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBuyers}</div>
              <p className="text-xs text-muted-foreground">Registered buyers</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/users">
                <Button className="w-full">Manage Users</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>View and manage all products</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/products">
                <Button className="w-full">Manage Products</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opportunity Management</CardTitle>
              <CardDescription>Review and manage job opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/opportunities">
                <Button className="w-full">Manage Opportunities</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Notifications</CardTitle>
              <CardDescription>Send messages to users</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/notifications">
                <Button className="w-full">Send Notification</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View detailed analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/analytics">
                <Button className="w-full">View Analytics</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/settings">
                <Button className="w-full">Open Settings</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post Updates</CardTitle>
              <CardDescription>Share news and updates with users</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/seller/updates">
                <Button className="w-full">Create Update</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
