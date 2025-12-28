import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Settings,
  Shield,
  FileText,
  LogOut,
  Camera,
  LayoutDashboard,
  Gift,
  Check,
  Loader2,
  MapPin,
} from "lucide-react";
import { useUserStatus } from "@/hooks/useUserStatus";
import { LocationSelector } from "@/components/LocationSelector";
import { useLocationNames } from "@/hooks/useLocations";

export default function Account() {
  useUserStatus();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    bio: "",
    location: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const locationNames = useLocationNames(profile?.province_id, profile?.district_id, profile?.sector_id);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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

    setProfile(profileData);
    setFormData({
      full_name: profileData?.full_name || "",
      business_name: profileData?.business_name || "",
      bio: profileData?.bio || "",
      location: profileData?.location || "",
    });
    setProvinceId(profileData?.province_id || "");
    setDistrictId(profileData?.district_id || "");
    setSectorId(profileData?.sector_id || "");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!roleData);
    setLoading(false);
  };

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        ...formData,
        province_id: provinceId || null,
        district_id: districtId || null,
        sector_id: sectorId || null,
      })
      .eq("id", session.user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditing(false);
      checkAuth();
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setUploading(true);

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/profile.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });

      checkAuth();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleApplyReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a referral code",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Check if user already has a referral
    if (profile?.referred_by) {
      toast({
        title: "Already Used",
        description: "You've already used a referral code.",
        variant: "destructive",
      });
      return;
    }

    setApplyingReferral(true);

    try {
      const { data, error } = await supabase.rpc('process_referral', {
        p_referral_code: referralCodeInput.trim().toUpperCase(),
        p_referred_user_id: session.user.id
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string } | null;
      
      if (result?.success) {
        toast({
          title: "✅ Referral code accepted successfully!",
          description: "Thank you for using a referral code.",
        });
        setReferralCodeInput("");
        checkAuth(); // Refresh profile
      } else {
        toast({
          title: "⚠️ Referral code not found or expired",
          description: result?.error || "Please check the code and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply referral code",
        variant: "destructive",
      });
    } finally {
      setApplyingReferral(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Simplified view for admin email
  if (profile?.email === "manishimweberenard@gmail.com" && isAdmin) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Account</h1>
            <NotificationBell />
          </div>
        </div>

        <main className="container mx-auto px-4 py-6 space-y-6">
          <Card>
            <CardContent className="p-4">
              <Link to="/admin/dashboard">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Account</h1>
          <NotificationBell />
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  {profile?.profile_image ? (
                    <img
                      src={profile.profile_image}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="file"
                  id="profile-image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                  disabled={uploading}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={() => document.getElementById('profile-image-upload')?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.user_type}
                </p>
              </div>
            </div>

            {editing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name (Optional)</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) =>
                      setFormData({ ...formData, business_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <LocationSelector
                    provinceId={provinceId}
                    districtId={districtId}
                    sectorId={sectorId}
                    onProvinceChange={setProvinceId}
                    onDistrictChange={setDistrictId}
                    onSectorChange={setSectorId}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{profile?.full_name || "Not set"}</p>
                  </div>
                  {profile?.business_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      <p className="font-medium">{profile.business_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <p className="font-medium">{profile?.bio || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location
                    </p>
                    <p className="font-medium">
                      {locationNames.sector || locationNames.district || locationNames.province || "Not set"}
                      {locationNames.district && locationNames.sector && `, ${locationNames.district}`}
                      {locationNames.province && (locationNames.district || locationNames.sector) && ` - ${locationNames.province}`}
                    </p>
                  </div>
                </div>
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Referral Code Section */}
        {!profile?.referred_by && (
          <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Add Referral Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Were you referred by someone? Enter their code to connect with them.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter referral code (e.g., RSM12345678)"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button
                  onClick={handleApplyReferralCode}
                  disabled={applyingReferral}
                >
                  {applyingReferral ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.referred_by && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Referral Applied</p>
                <p className="text-sm text-green-600 dark:text-green-400">Code: {profile.referred_by}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {profile?.user_type === "seller" && (
          <Card>
            <CardContent className="p-4">
              <Link to="/seller/dashboard">
                <Button variant="outline" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Seller Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardContent className="p-4">
              <Link to="/admin/dashboard">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Settings & Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings & Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Privacy Policy
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Terms and Conditions
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Disclaimer
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/contact')}>
              <FileText className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
