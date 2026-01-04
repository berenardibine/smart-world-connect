import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supaseClient";
import { toast } from "sonner";
import { 
  Lightbulb, Plus, Heart, MessageCircle, Users, Search, 
  Filter, TrendingUp, Clock, Sparkles, MapPin, FileText
} from "lucide-react";
import { format } from "date-fns";

interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  files: string[];
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  profile?: {
    full_name: string;
    profile_image: string;
    location: string;
  };
}

const CATEGORIES = [
  "AI & Machine Learning",
  "HealthTech",
  "Green Energy",
  "FinTech",
  "EdTech",
  "AgriTech",
  "IoT",
  "Blockchain",
  "Social Impact",
  "General"
];

export default function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("latest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: "", description: "", category: "General" });
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedIdeas, setLikedIdeas] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchIdeas();
    checkUser();
    
    const channel = supabase
      .channel('ideas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innovation_ideas' }, () => {
        fetchIdeas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, categoryFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      fetchLikedIdeas(session.user.id);
    }
  };

  const fetchLikedIdeas = async (userId: string) => {
    const { data } = await supabase
      .from('idea_likes')
      .select('idea_id')
      .eq('user_id', userId);
    
    if (data) {
      setLikedIdeas(new Set(data.map(like => like.idea_id)));
    }
  };

  const fetchIdeas = async () => {
    let query = supabase
      .from('innovation_ideas')
      .select(`
        *,
        profile:profiles!innovation_ideas_user_id_fkey(full_name, profile_image, location)
      `)
      .eq('status', 'published');

    if (categoryFilter !== "all") {
      query = query.eq('category', categoryFilter);
    }

    if (filter === "latest") {
      query = query.order('created_at', { ascending: false });
    } else if (filter === "trending") {
      query = query.order('likes_count', { ascending: false });
    } else if (filter === "collaborated") {
      query = query.order('comments_count', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching ideas:', error);
    } else {
      setIdeas(data || []);
    }
    setLoading(false);
  };

  const handleCreateIdea = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to share ideas");
      return;
    }

    if (!newIdea.title.trim() || !newIdea.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('innovation_ideas')
      .insert({
        user_id: currentUserId,
        title: newIdea.title,
        description: newIdea.description,
        category: newIdea.category
      });

    if (error) {
      toast.error("Failed to share idea");
      console.error(error);
    } else {
      toast.success("Idea shared successfully! 🚀");
      setNewIdea({ title: "", description: "", category: "General" });
      setShowCreateDialog(false);
      fetchIdeas();
    }
    setSubmitting(false);
  };

  const handleLike = async (ideaId: string) => {
    if (!currentUserId) {
      toast.error("Please sign in to like ideas");
      return;
    }

    const isLiked = likedIdeas.has(ideaId);

    if (isLiked) {
      await supabase.from('idea_likes').delete().eq('idea_id', ideaId).eq('user_id', currentUserId);
      await supabase.from('innovation_ideas').update({ likes_count: ideas.find(i => i.id === ideaId)!.likes_count - 1 }).eq('id', ideaId);
      setLikedIdeas(prev => { prev.delete(ideaId); return new Set(prev); });
    } else {
      await supabase.from('idea_likes').insert({ idea_id: ideaId, user_id: currentUserId });
      await supabase.from('innovation_ideas').update({ likes_count: ideas.find(i => i.id === ideaId)!.likes_count + 1 }).eq('id', ideaId);
      setLikedIdeas(prev => new Set(prev).add(ideaId));
    }
    fetchIdeas();
  };

  const filteredIdeas = ideas.filter(idea =>
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-orange-500 to-pink-500 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Lightbulb className="h-8 w-8 text-white animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Innovation Ideas</h1>
          </div>
          <p className="text-white/90 mb-6">Share your ideas, get feedback, and find collaborators</p>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-white text-primary hover:bg-white/90 rounded-full px-6 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Share Your Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Share Your Innovation
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Idea Title"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                />
                <Select 
                  value={newIdea.category} 
                  onValueChange={(value) => setNewIdea(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Describe your idea in detail..."
                  value={newIdea.description}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                />
                <Button 
                  className="w-full rounded-full" 
                  onClick={handleCreateIdea}
                  disabled={submitting}
                >
                  {submitting ? "Sharing..." : "Share Idea 🚀"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Tabs value={filter} onValueChange={setFilter} className="w-full">
              <TabsList className="bg-muted/50 rounded-full">
                <TabsTrigger value="latest" className="rounded-full text-xs">
                  <Clock className="h-3 w-3 mr-1" /> Latest
                </TabsTrigger>
                <TabsTrigger value="trending" className="rounded-full text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" /> Trending
                </TabsTrigger>
                <TabsTrigger value="collaborated" className="rounded-full text-xs">
                  <Users className="h-3 w-3 mr-1" /> Most Collaborated
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Badge 
              variant={categoryFilter === "all" ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setCategoryFilter("all")}
            >
              All
            </Badge>
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                className="cursor-pointer shrink-0 whitespace-nowrap"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Ideas Feed */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredIdeas.length === 0 ? (
          <Card className="p-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No ideas found</h3>
            <p className="text-muted-foreground mb-4">Be the first to share an innovation idea!</p>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" /> Share Idea
            </Button>
          </Card>
        ) : (
          filteredIdeas.map(idea => (
            <Card key={idea.id} className="p-5 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shrink-0">
                  {idea.profile?.profile_image ? (
                    <img 
                      src={idea.profile.profile_image} 
                      alt={idea.profile.full_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {idea.profile?.full_name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{idea.profile?.full_name || 'Anonymous'}</span>
                    {idea.profile?.location && (
                      <span className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-0.5" />
                        {idea.profile.location}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(idea.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {idea.category}
                  </Badge>
                  
                  <h3 className="font-semibold text-lg mt-2 group-hover:text-primary transition-colors">
                    💡 {idea.title}
                  </h3>
                  
                  <p className="text-muted-foreground mt-2 line-clamp-3">
                    {idea.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`gap-1.5 ${likedIdeas.has(idea.id) ? 'text-red-500' : ''}`}
                      onClick={() => handleLike(idea.id)}
                    >
                      <Heart className={`h-4 w-4 ${likedIdeas.has(idea.id) ? 'fill-current' : ''}`} />
                      {idea.likes_count}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <MessageCircle className="h-4 w-4" />
                      {idea.comments_count}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 ml-auto">
                      <Users className="h-4 w-4" />
                      Join Project
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
