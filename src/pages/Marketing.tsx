import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { DashboardFloatingButton } from "@/components/DashboardFloatingButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, ExternalLink, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MarketingPost {
  id: string;
  title: string;
  content: string;
  images: string[] | null;
  video_url: string | null;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  views: number;
  created_at: string;
  admin_id: string;
}

export default function Marketing() {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("marketing_posts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const incrementView = async (postId: string) => {
    await supabase
      .from("marketing_posts")
      .update({ views: posts.find(p => p.id === postId)?.views || 0 + 1 })
      .eq("id", postId);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">Marketing & Updates</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Marketing Posts Yet</h2>
            <p className="text-muted-foreground">
              Check back later for updates, promotions, and announcements.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                onClick={() => incrementView(post.id)}
              >
                {/* Image Gallery */}
                {post.images && post.images.length > 0 && (
                  <div className="relative">
                    <img
                      src={post.images[0]}
                      alt={post.title}
                      className="w-full h-64 object-cover"
                    />
                    {post.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs">
                        +{post.images.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                {/* Video */}
                {post.video_url && (
                  <video
                    src={post.video_url}
                    controls
                    className="w-full h-64 object-cover"
                  />
                )}

                <CardContent className="p-4">
                  <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                  
                  <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Admin
                      </span>
                    </div>

                    {post.link_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(post.link_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {post.link_text || "Learn More"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <DashboardFloatingButton />
      <BottomNav />
    </div>
  );
}
