import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { HorizontalNav } from "@/components/home/HorizontalNav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Phone, Search, UserPlus, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

interface Contact {
  id: string;
  full_name: string;
  business_name: string | null;
  profile_image: string | null;
  phone_number: string | null;
  last_message?: string;
  last_active?: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get unique contacts from conversations
      const { data: conversations } = await supabase
        .from("conversations")
        .select(`
          buyer_id,
          seller_id,
          updated_at
        `)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .order("updated_at", { ascending: false });

      if (!conversations) {
        setLoading(false);
        return;
      }

      // Extract unique contact IDs
      const contactIds = new Set<string>();
      conversations.forEach(conv => {
        if (conv.buyer_id !== session.user.id) contactIds.add(conv.buyer_id);
        if (conv.seller_id !== session.user.id) contactIds.add(conv.seller_id);
      });

      // Fetch contact profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, business_name, profile_image, phone_number, last_active")
        .in("id", Array.from(contactIds));

      setContacts(profiles || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startChat = async (contactId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Check if conversation exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(buyer_id.eq.${session.user.id},seller_id.eq.${contactId}),and(buyer_id.eq.${contactId},seller_id.eq.${session.user.id})`)
      .maybeSingle();

    if (existingConv) {
      navigate(`/messages?conv=${existingConv.id}`);
    } else {
      navigate("/messages");
    }
  };

  return (
    <>
      <Helmet>
        <title>Contacts | Smart World Connect</title>
        <meta name="description" content="Manage your contacts on Smart World Connect" />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <Navbar />
        <HorizontalNav />

        <div className="pt-[120px] md:pt-[140px]">
          <div className="container mx-auto px-4 py-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">No Contacts Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start a conversation with a seller to add them to your contacts
                </p>
                <Button onClick={() => navigate("/shop")}>
                  Browse Shops
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <Card key={contact.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={contact.profile_image || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {contact.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {contact.business_name || contact.full_name}
                          </h3>
                          {contact.phone_number && (
                            <p className="text-sm text-muted-foreground">
                              {contact.phone_number}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {contact.phone_number && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(`tel:${contact.phone_number}`)}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            onClick={() => startChat(contact.id)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
