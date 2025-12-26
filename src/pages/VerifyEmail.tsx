import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle, ShoppingBag, ArrowLeft, RefreshCw } from "lucide-react";
import { Helmet } from "react-helmet";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(120); // Start with 2 minute countdown
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkUserStatus();
    
    // Listen for auth changes (when user verifies email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        setIsVerified(true);
        toast({
          title: "Email Verified!",
          description: "Your email has been verified successfully.",
        });
        // Redirect after short delay
        setTimeout(async () => {
          // Check user type to redirect appropriately
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", session.user.id)
            .single();

          if (profile?.user_type === "seller") {
            navigate("/seller/dashboard");
          } else {
            navigate("/");
          }
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkUserStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserEmail(session.user.email || null);

    // If already verified, redirect
    if (session.user.email_confirmed_at) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();

      if (profile?.user_type === "seller") {
        navigate("/seller/dashboard");
      } else {
        navigate("/");
      }
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      // Refresh session to check latest verification status
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session?.user?.email_confirmed_at) {
        setIsVerified(true);
        toast({
          title: "Email Verified!",
          description: "Redirecting you now...",
        });
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", session.user.id)
          .single();

        setTimeout(() => {
          if (profile?.user_type === "seller") {
            navigate("/seller/dashboard");
          } else {
            navigate("/");
          }
        }, 1500);
      } else {
        toast({
          title: "Not yet verified",
          description: "Please check your email and click the verification link.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking verification:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendVerification = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail!,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Verification link sent!",
        description: "Please check your email inbox.",
      });
      
      // Start 2 minute countdown
      setCountdown(120);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">Email Verified!</h2>
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
            <div className="mt-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Verify Email - Smart Market</title>
        <meta name="description" content="Verify your email to access all features of Smart Market" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button 
            onClick={() => navigate("/auth")} 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </button>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-10 w-10 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a verification link to continue
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Verification link sent to:
                </p>
                <p className="font-semibold text-lg text-foreground break-all">
                  {userEmail || "your email"}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCheckVerification}
                  disabled={isChecking}
                  className="w-full h-12"
                  size="lg"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      I've Verified My Email
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleResendVerification}
                  disabled={countdown > 0 || isResending}
                  variant="outline"
                  className="w-full h-12"
                  size="lg"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend in ${formatCountdown(countdown)}`
                  ) : (
                    "Resend Verification Link"
                  )}
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  Didn't receive the email?
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure {userEmail} is correct</li>
                  <li>• Wait a few minutes and try again</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-center text-muted-foreground mb-3">
                  After verifying your email, you'll be able to:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Post products</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <Mail className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Send messages</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Full access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}