import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw, CheckCircle, ArrowLeft, Clock } from "lucide-react";

export default function PendingVerification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // If already verified, redirect to home
    if (session.user.email_confirmed_at) {
      navigate("/");
      return;
    }

    setEmail(session.user.email || "");
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      toast({
        title: "Email Sent!",
        description: "Check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      if (session?.user.email_confirmed_at) {
        toast({
          title: "Email Verified!",
          description: "Welcome to Smart Market!",
        });
        navigate("/");
      } else {
        toast({
          title: "Not Verified Yet",
          description: "Please check your email and click the verification link.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Verification Pending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                We've sent a verification email to:
              </p>
              <p className="font-medium text-lg">{email}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Check your inbox</p>
                  <p className="text-muted-foreground">Click the verification link in the email we sent you</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Verify & access all features</p>
                  <p className="text-muted-foreground">Once verified, you'll have full access to Smart Market</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCheckVerification}
                disabled={checking}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Checking..." : "I've Verified My Email"}
              </Button>

              <Button
                onClick={handleResendEmail}
                variant="outline"
                disabled={resending}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {resending ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Wrong email or want to start over?
              </p>
              <button
                onClick={handleLogout}
                className="text-sm text-primary hover:underline font-medium"
              >
                Sign out and try again
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Didn't receive the email? Check your spam folder or contact support.
        </p>
      </div>
    </div>
  );
}
