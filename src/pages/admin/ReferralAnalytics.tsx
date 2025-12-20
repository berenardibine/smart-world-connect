import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Check, X, AlertTriangle, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { Skeleton } from "@/components/ui/skeleton";

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  is_valid: boolean;
  status: string;
  created_at: string;
  referrer?: {
    full_name: string;
    email: string;
    profile_image: string | null;
  };
  referred?: {
    full_name: string;
    email: string;
    profile_image: string | null;
  };
}

interface TopReferrer {
  id: string;
  full_name: string;
  profile_image: string | null;
  count: number;
}

const ReferralAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    pending: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all referrals
      const { data: referralsData } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (referralsData) {
        // Fetch related profiles
        const referrerIds = [...new Set(referralsData.map(r => r.referrer_id))];
        const referredIds = [...new Set(referralsData.map(r => r.referred_user_id))];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, profile_image")
          .in("id", [...referrerIds, ...referredIds]);

        const referralsWithProfiles = referralsData.map(referral => ({
          ...referral,
          referrer: profiles?.find(p => p.id === referral.referrer_id),
          referred: profiles?.find(p => p.id === referral.referred_user_id)
        }));

        setReferrals(referralsWithProfiles);

        // Calculate stats
        setStats({
          total: referralsData.length,
          valid: referralsData.filter(r => r.is_valid && r.status === "active").length,
          invalid: referralsData.filter(r => !r.is_valid).length,
          pending: referralsData.filter(r => r.status === "pending").length
        });

        // Calculate top referrers
        const referrerCounts: { [key: string]: number } = {};
        referralsData.forEach(r => {
          if (r.is_valid) {
            referrerCounts[r.referrer_id] = (referrerCounts[r.referrer_id] || 0) + 1;
          }
        });

        const topReferrersList = Object.entries(referrerCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([id, count]) => {
            const profile = profiles?.find(p => p.id === id);
            return {
              id,
              full_name: profile?.full_name || "Unknown",
              profile_image: profile?.profile_image || null,
              count
            };
          });

        setTopReferrers(topReferrersList);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-24">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 pb-24">
        <h1 className="text-2xl font-bold mb-6">Referral Analytics</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.valid}</p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.invalid}</p>
                  <p className="text-xs text-muted-foreground">Invalid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Referrers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Referrers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topReferrers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No referrers yet</p>
              ) : (
                <div className="space-y-3">
                  {topReferrers.map((referrer, i) => (
                    <div key={referrer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary w-6">#{i + 1}</span>
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                          {referrer.profile_image ? (
                            <img src={referrer.profile_image} alt="" className="w-8 h-8 object-cover" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-medium">{referrer.full_name}</span>
                      </div>
                      <Badge>{referrer.count} referrals</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Referrals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No referrals yet</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {referrals.slice(0, 10).map((referral) => (
                    <div key={referral.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{referral.referral_code}</span>
                        <Badge variant={
                          referral.status === "active" ? "default" :
                          referral.status === "pending" ? "secondary" :
                          "destructive"
                        }>
                          {referral.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{referral.referrer?.full_name || "Unknown"}</span>
                        <span>→</span>
                        <span>{referral.referred?.full_name || "Unknown"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
};

export default ReferralAnalytics;
