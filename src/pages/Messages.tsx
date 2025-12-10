import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { useUserStatus } from "@/hooks/useUserStatus";
import { z } from "zod";

// Message validation schema
const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long (max 1000 characters)'),
});

export default function Messages() {
  useUserStatus();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Subscribe to conversation updates to refresh list
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          if (currentUser) {
            fetchConversations(currentUser.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setCurrentUser(profile);
    await fetchConversations(session.user.id);
    setLoading(false);
  };

  const fetchConversations = async (userId: string) => {
    const { data } = await supabase
      .from("conversations")
      .select(`
        *,
        product:products(title, images),
        buyer:profiles!conversations_buyer_id_fkey(full_name, business_name),
        seller:profiles!conversations_seller_id_fkey(full_name, business_name)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    setConversations(data || []);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(full_name, business_name)
      `)
      .eq("conversation_id", selectedConversation.id)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark messages as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", selectedConversation.id)
      .neq("sender_id", currentUser.id);
  };

  const sendMessage = async () => {
    // Validate message
    try {
      messageSchema.parse({ content: newMessage });
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

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUser.id,
        content: newMessage.trim(),
        delivered_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return;
    }

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", selectedConversation.id);

    setNewMessage("");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {conversations.map((conv) => {
                  const isUserBuyer = currentUser.id === conv.buyer_id;
                  const otherParty = isUserBuyer ? conv.seller : conv.buyer;
                  const otherPersonName = otherParty?.business_name || otherParty?.full_name || "Unknown User";
                  
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-muted" : ""
                      }`}
                    >
                      <p className="font-semibold">{otherPersonName}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.product?.title}</p>
                    </div>
                  );
                })}
                {conversations.length === 0 && (
                  <p className="p-4 text-muted-foreground text-center">No conversations yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-4">
              {selectedConversation ? (
                <>
                  <div className="border-b pb-4 mb-4">
                    <h2 className="font-semibold">{selectedConversation.product?.title}</h2>
                  </div>

                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            msg.sender_id === currentUser.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className="text-xs opacity-70">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                            {msg.sender_id === currentUser.id && msg.delivered_at && (
                              <p className="text-xs opacity-70">Delivered</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
