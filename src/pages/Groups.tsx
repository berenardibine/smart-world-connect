import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Users, Lock, Globe, MapPin, MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

interface Group {
  id: string;
  name: string;
  description: string | null;
  logo_image: string | null;
  member_count: number;
  is_public: boolean;
  is_regional: boolean;
  seller_id: string;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const loadGroups = async () => {
    try {
      // Load all public groups (communities used as groups)
      const { data: allGroups } = await supabase
        .from("communities")
        .select("*")
        .eq("is_public", true)
        .order("member_count", { ascending: false });

      if (allGroups) {
        setGroups(allGroups);
      }

      // Load user's groups
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: memberships } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", session.user.id);

        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map(m => m.community_id);
          const { data: userGroups } = await supabase
            .from("communities")
            .select("*")
            .in("id", groupIds);

          if (userGroups) {
            setMyGroups(userGroups);
          }
        }
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const GroupCard = ({ group }: { group: Group }) => (
    <Link to={`/community/${group.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={group.logo_image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary rounded-xl text-lg font-bold">
                {group.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
                {!group.is_public && <Lock className="h-3 w-3 text-muted-foreground" />}
                {group.is_regional && <MapPin className="h-3 w-3 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {group.description || "No description"}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {group.member_count} members
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Groups</h1>
            {userId && (
              <Button size="sm" className="rounded-full gap-2" asChild>
                <Link to="/seller/community/create">
                  <Plus className="h-4 w-4" />
                  Create
                </Link>
              </Button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full bg-muted/50 border-border/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4">
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="discover" className="rounded-full">
              <Globe className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-groups" className="rounded-full">
              <Users className="h-4 w-4 mr-2" />
              My Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 rounded-xl bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-3 w-full bg-muted rounded" />
                          <div className="h-5 w-24 bg-muted rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No groups found</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </TabsContent>

          <TabsContent value="my-groups" className="space-y-3">
            {!userId ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">Sign in to see your groups</p>
                <Button asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              </div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">You haven't joined any groups yet</p>
                <Button variant="outline" onClick={() => {}}>
                  Explore Groups
                </Button>
              </div>
            ) : (
              myGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}
