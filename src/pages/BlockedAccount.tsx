import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

// Admin message validation schema
const adminMessageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long (max 1000 characters)'),
});

export default function BlockedAccount() {
  const location = useLocation();
  const reason = location.state?.reason || "Your account has been restricted";
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async () => {
    // Validate message
    try {
      adminMessageSchema.parse({ message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("admin_messages")
        .insert({
          user_id: session?.user.id,
          message: message,
        });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "An administrator will review your message",
      });
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/10 via-destructive/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-center text-2xl">Account Restricted</CardTitle>
          <CardDescription className="text-center">
            Your account access has been limited
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm font-medium mb-2">Reason:</p>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Contact Administrator</p>
              <Textarea
                placeholder="Explain your situation or appeal the decision..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={1000}
              />
            </div>
            <Button onClick={sendMessage} disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Message to Admin"}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              Sign Out
            </Button>
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please contact support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
