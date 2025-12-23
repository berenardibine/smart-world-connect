import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Copy, Users, Check, X, TrendingUp, Share2, Link, 
  MessageCircle, Facebook, QrCode, Award, Clock
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Referral {
  id: string;
  referred_user_id: string;
  referral_code: string;
  is_valid: boolean;
  status: string;
  created_at: string;
  referred_user?: {
    full_name: string;
    email: string;
    user_type: string;
    profile_image: string | null;
  };
}

const SellerReferrals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    invalid: 0
  });

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user's referral code
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code, user_type")
        .eq("id", user.id)
        .single();

      if (profile?.user_type !== "seller") {
        toast.error("Only sellers can access referrals");
        navigate("/");
        return;
      }

      setReferralCode(profile?.referral_code || "");

      // Get referrals
      const { data: referralsData } = await supabase
        .from("referrals")
        .select(`
          id,
          referred_user_id,
          referral_code,
          is_valid,
          status,
          created_at
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (referralsData) {
        // Fetch referred users' profiles
        const userIds = referralsData.map(r => r.referred_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, user_type, profile_image")
          .in("id", userIds);

        const referralsWithUsers = referralsData.map(referral => ({
          ...referral,
          referred_user: profiles?.find(p => p.id === referral.referred_user_id)
        }));

        setReferrals(referralsWithUsers);

        // Calculate stats
        setStats({
          total: referralsData.length,
          active: referralsData.filter(r => r.status === "active").length,
          pending: referralsData.filter(r => r.status === "pending").length,
          invalid: referralsData.filter(r => !r.is_valid).length
        });
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  const shareReferralLink = async () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Rwanda Smart Market",
          text: "Join me on Rwanda Smart Market using my referral code!",
          url: link
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const shareOnWhatsApp = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    const message = encodeURIComponent(`🛒 Join Rwanda Smart Market!\n\nSign up using my referral code and start shopping or selling today!\n\n👉 ${link}\n\nCode: ${referralCode}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast.success("Opening WhatsApp...");
  };

  const shareOnFacebook = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(`Join Rwanda Smart Market using my referral code: ${referralCode}`)}`, '_blank');
    toast.success("Opening Facebook...");
  };

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

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
          <Skeleton className="h-40 mb-6" />
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
        <h1 className="text-2xl font-bold mb-6">My Referrals</h1>

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
                  <p className="text-xs text-muted-foreground">Total</p>
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
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-full">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
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

        {/* Referral Code Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Share your unique code and earn rewards when new users join!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Code Display */}
            <div className="p-4 bg-background rounded-lg border-2 border-dashed border-primary/30 text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Code</p>
              <p className="text-3xl font-bold font-mono tracking-wider text-primary">{referralCode}</p>
            </div>

            {/* Referral Link */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Referral Link</p>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={copyReferralLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Share via</p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={shareOnWhatsApp} className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button onClick={shareOnFacebook} className="bg-blue-600 hover:bg-blue-700">
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={copyReferralCode} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button onClick={shareReferralLink} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  More Options
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Share your referral code with friends and family. When they sign up using your code, both of you benefit!
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>Referred Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No referrals yet</p>
                <p className="text-sm">Share your referral code to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        {referral.referred_user?.profile_image ? (
                          <img
                            src={referral.referred_user.profile_image}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{referral.referred_user?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        referral.status === "active"
                          ? "bg-green-500/20 text-green-500"
                          : referral.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {referral.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
};

export default SellerReferrals;
