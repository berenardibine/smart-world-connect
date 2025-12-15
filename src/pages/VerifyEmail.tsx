import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle, ShoppingBag } from "lucide-react";
import { Helmet } from "react-helmet";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

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
        setTimeout(() => {
          navigate("/seller/dashboard");
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Email Verified!</h2>
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Verify Email - Rwanda Smart Market</title>
        <meta name="description" content="Verify your email to access all features of Rwanda Smart Market" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              Please verify your email to continue using Rwanda Smart Market
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                We've sent a verification link to:
              </p>
              <p className="font-semibold text-primary mt-1">
                {userEmail || "your email"}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Didn't receive the email? Check your spam folder or click below to resend.
              </p>
              
              <Button
                onClick={handleResendVerification}
                disabled={countdown > 0 || isResending}
                className="w-full"
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

            <div className="border-t pt-4">
              <p className="text-xs text-center text-muted-foreground">
                After verifying your email, you'll be able to:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Post products and services</li>
                <li>• Send messages to sellers</li>
                <li>• Access all marketplace features</li>
              </ul>
            </div>

            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
