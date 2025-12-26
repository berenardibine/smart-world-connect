import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Gift } from "lucide-react";
import { z } from "zod";
import { LocationSelector } from "@/components/LocationSelector";

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
  whatsappNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid WhatsApp number").optional(),
  callNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid call number").optional(),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [callNumber, setCallNumber] = useState("");
  const [userType, setUserType] = useState("buyer");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get referral code from URL on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false); // Switch to signup mode if coming from referral link
    }
  }, [searchParams]);

  const processReferral = async (userId: string, code: string) => {
    try {
      const { data, error } = await supabase.rpc('process_referral', {
        p_referral_code: code,
        p_referred_user_id: userId
      });
      
      if (error) {
        console.error("Referral processing error:", error);
        return;
      }
      
      // Cast data to check success property
      const result = data as { success?: boolean } | null;
      if (result?.success) {
        toast({
          title: "Referral Applied!",
          description: "You've been registered with a referral code.",
        });
      }
    } catch (error) {
      console.error("Error processing referral:", error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validationData: any = { email, password };
      if (!isLogin) {
        validationData.fullName = fullName;
        validationData.phoneNumber = phoneNumber;
        if (userType === "seller") {
          validationData.whatsappNumber = whatsappNumber;
          validationData.callNumber = callNumber;
        }
      }
      
      const validated = authSchema.parse(validationData);

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });
        if (error) throw error;

        // Check if email is verified - redirect to verify page without toast
        if (!data.user.email_confirmed_at) {
          navigate("/verify-email");
          return;
        }

        // Check user status
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type, status, blocking_reason")
          .eq("id", data.user.id)
          .single();

        if (profile?.status === "banned" || profile?.status === "blocked") {
          await supabase.auth.signOut();
          navigate("/blocked", { state: { reason: profile.blocking_reason } });
          return;
        }
        
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (roleData) {
          toast({ title: "Welcome back, Admin!" });
          navigate("/admin/dashboard");
          return;
        }

        toast({ title: "Welcome back!" });
        
        if (profile?.user_type === "seller") {
          navigate("/seller/dashboard");
        } else {
          navigate("/");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            data: {
              full_name: validated.fullName,
              user_type: userType,
              phone_number: validated.phoneNumber,
              whatsapp_number: validated.whatsappNumber,
              call_number: validated.callNumber,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;

        // Update profile with location if selected
        if (data.user && (provinceId || districtId || sectorId)) {
          await supabase
            .from("profiles")
            .update({
              province_id: provinceId || null,
              district_id: districtId || null,
              sector_id: sectorId || null,
            })
            .eq("id", data.user.id);
        }

        // Process referral if code exists
        if (data.user && referralCode) {
          await processReferral(data.user.id, referralCode);
        }

        // Redirect to verification pending page (no toast, just redirect)
        navigate("/verify-email");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">RSM</span>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your Rwanda Smart Market account"
                : "Join Rwanda's premier online marketplace"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Referral Code Badge */}
            {referralCode && !isLogin && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Referral Code Applied</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{referralCode}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+250780000000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>I want to</Label>
                    <RadioGroup value={userType} onValueChange={setUserType} className="flex gap-4">
                      <div className="flex items-center space-x-2 flex-1 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="buyer" id="buyer" />
                        <Label htmlFor="buyer" className="font-normal cursor-pointer flex-1">
                          Buy products
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 flex-1 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="seller" id="seller" />
                        <Label htmlFor="seller" className="font-normal cursor-pointer flex-1">
                          Sell products
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {userType === "seller" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">WhatsApp</Label>
                        <Input
                          id="whatsappNumber"
                          type="tel"
                          placeholder="+250780000000"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="callNumber">Call Number</Label>
                        <Input
                          id="callNumber"
                          type="tel"
                          placeholder="+250780000000"
                          value={callNumber}
                          onChange={(e) => setCallNumber(e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>
                    </div>
                  )}

                  {/* Location Selection */}
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

                  {/* Referral Code Input */}
                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      Referral Code (Optional)
                    </Label>
                    <Input
                      id="referralCode"
                      placeholder="Enter referral code (e.g., RSM12345678)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="h-12 font-mono"
                    />
                    {referralCode && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Referral code will be applied after signup
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password {!isLogin && "(min 8 characters)"}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}