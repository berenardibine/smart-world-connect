import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
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

    await fetchUsers();
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    setUsers(data || []);
  };

  const sendNotifications = async () => {
    if (!title || !message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    let recipientIds: string[] = [];

    if (recipient === "all") {
      recipientIds = users.map(u => u.id);
    } else if (recipient === "sellers") {
      recipientIds = users.filter(u => u.user_type === "seller").map(u => u.id);
    } else if (recipient === "buyers") {
      recipientIds = users.filter(u => u.user_type === "buyer").map(u => u.id);
    } else {
      recipientIds = [recipient];
    }

    const notifications = recipientIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: "info" as const,
    }));

    const { error } = await supabase
      .from("notifications")
      .insert(notifications);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Notification sent to ${recipientIds.length} user(s)`,
      });
      setTitle("");
      setMessage("");
      setRecipient("all");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Send Notifications</h1>
          <p className="text-muted-foreground">Send notifications to users</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Recipients</label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="sellers">All Sellers</SelectItem>
                  <SelectItem value="buyers">All Buyers</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder="Notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            <Button onClick={sendNotifications} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
