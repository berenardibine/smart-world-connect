import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users, MessageSquare, Heart, Share2, MoreHorizontal, 
  Image as ImageIcon, Video, TrendingUp, Plus, Filter 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Helmet } from "react-helmet";

const mockPosts = [
  {
    id: 1,
    author: {
      name: "Smart Market Official",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SM",
      isVerified: true,
    },
    content: "🎉 Big announcement! We're launching Smart Rewards this week. Complete challenges, earn coins, and win amazing prizes! Stay tuned for more updates.",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop",
    likes: 234,
    comments: 45,
    shares: 12,
    createdAt: "2h ago",
    isTrending: true,
  },
  {
    id: 2,
    author: {
      name: "Tech Store Rwanda",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TSR",
      isVerified: true,
    },
    content: "New iPhone 15 Pro Max now available! Get yours today with free delivery in Kigali. Limited stock! 📱✨",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=400&fit=crop",
    likes: 189,
    comments: 32,
    shares: 8,
    createdAt: "4h ago",
    isTrending: false,
  },
  {
    id: 3,
    author: {
      name: "Fashion Hub",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=FH",
      isVerified: false,
    },
    content: "Summer collection is here! ☀️ Check out our latest designs - perfect for the season. Use code SUMMER20 for 20% off!",
    likes: 156,
    comments: 28,
    shares: 15,
    createdAt: "6h ago",
    isTrending: false,
  },
];

export default function Community() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <>
      <Helmet>
        <title>Community - Smart Market</title>
        <meta name="description" content="Join the Smart Market community. Connect with sellers, share updates, and discover trending products." />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <Navbar />

        <main className="pt-[120px] md:pt-20">
          <div className="container mx-auto px-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="section-header flex items-center gap-2">
                  <Users className="h-7 w-7 text-primary" />
                  Community
                </h1>
                <p className="section-subheader">Connect, share, and grow together</p>
              </div>
              <Button className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Post</span>
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <TabsList className="bg-muted/50 p-1 rounded-2xl">
                  <TabsTrigger value="all" className="rounded-xl px-4">All</TabsTrigger>
                  <TabsTrigger value="trending" className="rounded-xl px-4">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="following" className="rounded-xl px-4">Following</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="icon" className="rounded-xl">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <TabsContent value="all" className="mt-6 space-y-6">
                {mockPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </TabsContent>

              <TabsContent value="trending" className="mt-6 space-y-6">
                {mockPosts.filter(p => p.isTrending).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </TabsContent>

              <TabsContent value="following" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Follow sellers to see their updates here</p>
                  <Button variant="outline" className="mt-4 rounded-xl">
                    Discover Sellers
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}

function PostCard({ post }: { post: typeof mockPosts[0] }) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <article className="glass-card p-5 space-y-4">
      {/* Author */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full bg-muted"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{post.author.name}</span>
              {post.author.isVerified && (
                <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px]">✓</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{post.createdAt}</span>
          </div>
        </div>
        {post.isTrending && (
          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Trending
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-foreground">{post.content}</p>

      {/* Image */}
      {post.image && (
        <div className="rounded-2xl overflow-hidden">
          <img
            src={post.image}
            alt="Post"
            className="w-full h-auto max-h-80 object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
            isLiked ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">{post.likes + (isLiked ? 1 : 0)}</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">{post.comments}</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <Share2 className="h-5 w-5" />
          <span className="text-sm font-medium">{post.shares}</span>
        </button>
        <button className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
