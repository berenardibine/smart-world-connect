import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Bell, Smartphone, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Notification validation schema
const notificationSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title is too long (max 100 characters)'),
  message: z.string()
    .trim()
    .min(1, 'Message is required')
    .max(500, 'Message is too long (max 500 characters)'),
});

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [sendPush, setSendPush] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [pushSubscriptionCount, setPushSubscriptionCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

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

    await Promise.all([fetchUsers(), fetchPushSubscriptionCount()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, user_type")
      .order("full_name");

    setUsers(data || []);
  };

  const fetchPushSubscriptionCount = async () => {
    const { count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true });
    
    setPushSubscriptionCount(count || 0);
  };

  const sendNotifications = async () => {
    try {
      // Validate notification data
      const validation = notificationSchema.safeParse({ title, message });

      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      setSending(true);

      // Send in-app notification
      if (sendInApp) {
        const { data, error } = await supabase.functions.invoke('send-admin-notification', {
          body: {
            title,
            message,
            recipient,
            specificUserId: recipient !== 'all' && recipient !== 'sellers' && recipient !== 'buyers' ? recipient : undefined
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      // Send push notification
      if (sendPush) {
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
          body: {
            title,
            body: message,
            recipient,
            specificUserId: recipient !== 'all' && recipient !== 'sellers' && recipient !== 'buyers' ? recipient : undefined
          }
        });

        if (error) {
          console.error('Push notification error:', error);
          // Don't throw, just log - in-app notification may have succeeded
        }
      }

      toast({
        title: "Success",
        description: `Notification sent successfully`,
      });

      setTitle("");
      setMessage("");
      setRecipient("all");
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Send Notifications</h1>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Stats Cards */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Smartphone className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Push Subscribers</p>
                  <p className="text-2xl font-bold">{pushSubscriptionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/10">
                  <Send className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sellers</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.user_type === 'seller').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Create Notification
            </CardTitle>
            <CardDescription>
              Send in-app and push notifications to your users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipients */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users ({users.length})</SelectItem>
                  <SelectItem value="sellers">All Sellers ({users.filter(u => u.user_type === 'seller').length})</SelectItem>
                  <SelectItem value="buyers">All Buyers ({users.filter(u => u.user_type === 'buyer').length})</SelectItem>
                  {users.slice(0, 50).map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
            </div>

            {/* Notification Types */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Notification Channels</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inApp">In-App Notification</Label>
                  <p className="text-xs text-muted-foreground">Shows in the notification bell</p>
                </div>
                <Switch
                  id="inApp"
                  checked={sendInApp}
                  onCheckedChange={setSendInApp}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push">Push Notification</Label>
                  <p className="text-xs text-muted-foreground">
                    Sends to {pushSubscriptionCount} subscribed devices
                  </p>
                </div>
                <Switch
                  id="push"
                  checked={sendPush}
                  onCheckedChange={setSendPush}
                />
              </div>
            </div>

            <Button 
              onClick={sendNotifications} 
              className="w-full" 
              disabled={sending || (!sendInApp && !sendPush)}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}