import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Users, Check, X, AlertTriangle, TrendingUp, Search, RefreshCw, Eye,
  Shield, Ban, CheckCircle, Clock, AlertCircle
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  is_valid: boolean;
  status: string;
  created_at: string;
  referrer?: {
    id: string;
    full_name: string;
    email: string;
    profile_image: string | null;
    business_name: string | null;
  };
  referred?: {
    id: string;
    full_name: string;
    email: string;
    profile_image: string | null;
  };
}

interface SellerReferralList {
  seller: {
    id: string;
    full_name: string;
    email: string;
    profile_image: string | null;
    business_name: string | null;
    referral_code: string | null;
  };
  referrals: Referral[];
  validCount: number;
  invalidCount: number;
}

interface TopReferrer {
  id: string;
  full_name: string;
  profile_image: string | null;
  count: number;
}

interface ReferralLog {
  id: string;
  referral_code: string;
  status: string;
  reason: string | null;
  detected_by: string | null;
  created_at: string;
}

const ReferralAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [sellerReferralLists, setSellerReferralLists] = useState<SellerReferralList[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [referralLogs, setReferralLogs] = useState<ReferralLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    pending: 0,
    suspected: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all referrals and referral logs
      const [referralsResult, logsResult] = await Promise.all([
        supabase.from("referrals").select("*").order("created_at", { ascending: false }),
        supabase.from("referral_logs").select("*").order("created_at", { ascending: false }).limit(50)
      ]);
      
      const referralsData = referralsResult.data;
      
      if (logsResult.data) {
        setReferralLogs(logsResult.data);
      }

      if (referralsData) {
        // Fetch related profiles
        const referrerIds = [...new Set(referralsData.map(r => r.referrer_id).filter(Boolean))];
        const referredIds = [...new Set(referralsData.map(r => r.referred_user_id).filter(Boolean))];
        const allUserIds = [...new Set([...referrerIds, ...referredIds])];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, profile_image, business_name, referral_code, user_type")
          .in("id", allUserIds);

        // Get all sellers
        const { data: allSellers } = await supabase
          .from("profiles")
          .select("id, full_name, email, profile_image, business_name, referral_code")
          .eq("user_type", "seller");

        const referralsWithProfiles = referralsData.map(referral => ({
          ...referral,
          referrer: profiles?.find(p => p.id === referral.referrer_id),
          referred: profiles?.find(p => p.id === referral.referred_user_id)
        }));

        setReferrals(referralsWithProfiles);

        // Create seller referral lists
        const sellerLists: SellerReferralList[] = (allSellers || []).map(seller => {
          const sellerRefs = referralsWithProfiles.filter(r => r.referrer_id === seller.id);
          return {
            seller,
            referrals: sellerRefs,
            validCount: sellerRefs.filter(r => r.is_valid && r.status === "active").length,
            invalidCount: sellerRefs.filter(r => !r.is_valid).length
          };
        }).sort((a, b) => b.referrals.length - a.referrals.length);

        setSellerReferralLists(sellerLists);

        // Calculate stats
        setStats({
          total: referralsData.length,
          valid: referralsData.filter(r => r.is_valid && r.status === "active").length,
          invalid: referralsData.filter(r => !r.is_valid).length,
          pending: referralsData.filter(r => r.status === "pending").length,
          suspected: referralsData.filter(r => r.status === "suspected").length
        });

        // Calculate top referrers
        const referrerCounts: { [key: string]: number } = {};
        referralsData.forEach(r => {
          if (r.is_valid && r.referrer_id) {
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

  const filteredSellerLists = sellerReferralLists.filter(item =>
    item.seller.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.seller.business_name && item.seller.business_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Referral Analytics</h1>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

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

        {/* AI Suspected Stats */}
        {stats.suspected > 0 && (
          <Card className="mb-6 border-orange-500/50 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-800 dark:text-orange-200">
                  {stats.suspected} Suspected Referrals Detected
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  AI Manager has flagged these referrals for review
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-orange-500 text-orange-700">
                Review
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all-sellers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all-sellers">
              <Eye className="h-4 w-4 mr-2" />
              All Sellers
            </TabsTrigger>
            <TabsTrigger value="top-referrers">
              <TrendingUp className="h-4 w-4 mr-2" />
              Top Referrers
            </TabsTrigger>
            <TabsTrigger value="fraud-logs">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Fraud Logs
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Users className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-sellers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Sellers' Referrals</span>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sellers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSellerLists.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sellers found</p>
                ) : (
                  <div className="space-y-4">
                    {filteredSellerLists.map((item) => (
                      <div key={item.seller.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={item.seller.profile_image || undefined} />
                              <AvatarFallback>{item.seller.full_name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{item.seller.business_name || item.seller.full_name}</p>
                              <p className="text-sm text-muted-foreground">{item.seller.email}</p>
                              {item.seller.referral_code && (
                                <code className="text-xs bg-muted px-2 py-0.5 rounded">{item.seller.referral_code}</code>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.referrals.length} total</Badge>
                            <Badge className="bg-green-500">{item.validCount} valid</Badge>
                            {item.invalidCount > 0 && (
                              <Badge variant="destructive">{item.invalidCount} invalid</Badge>
                            )}
                          </div>
                        </div>
                        
                        {item.referrals.length > 0 && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Referred Users:</p>
                            <div className="grid gap-2 md:grid-cols-2">
                              {item.referrals.slice(0, 6).map((ref) => (
                                <div key={ref.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={ref.referred?.profile_image || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {ref.referred?.full_name?.[0] || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{ref.referred?.full_name || "Unknown"}</span>
                                  </div>
                                  <Badge 
                                    variant={ref.is_valid ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {ref.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                            {item.referrals.length > 6 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{item.referrals.length - 6} more referrals
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-referrers">
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
                      <div key={referrer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary w-8 text-center">#{i + 1}</span>
                          <Avatar>
                            <AvatarImage src={referrer.profile_image || undefined} />
                            <AvatarFallback>{referrer.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{referrer.full_name}</span>
                        </div>
                        <Badge className="bg-primary">{referrer.count} referrals</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fraud-logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  AI Fraud Detection Logs
                </CardTitle>
                <CardDescription>
                  Referrals flagged by AI Manager for suspicious activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No fraud logs detected</p>
                    <p className="text-sm">AI Manager is actively monitoring for suspicious activity</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {referralLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-4 rounded-lg border ${
                          log.status === "suspected" 
                            ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                            : log.status === "invalid"
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <code className="font-mono text-sm font-bold">{log.referral_code}</code>
                          <Badge variant={
                            log.status === "valid" ? "default" :
                            log.status === "suspected" ? "secondary" :
                            "destructive"
                          }>
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {log.reason || "No reason provided"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {log.detected_by || "System"}
                          </span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No referrals yet</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {referrals.slice(0, 20).map((referral) => (
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
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={referral.referrer?.profile_image || undefined} />
                              <AvatarFallback className="text-xs">{referral.referrer?.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{referral.referrer?.full_name || "Unknown"}</span>
                          </div>
                          <span className="text-muted-foreground">→</span>
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={referral.referred?.profile_image || undefined} />
                              <AvatarFallback className="text-xs">{referral.referred?.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{referral.referred?.full_name || "Unknown"}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(referral.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
};

export default ReferralAnalytics;
