import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  GraduationCap, Play, Clock, Star, BookOpen, 
  Search, Filter, Users, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Helmet } from "react-helmet";
import { supabase } from "@/lib/supaseClient";

interface LearningPost {
  id: string;
  title: string;
  description: string;
  content: string | null;
  category: string;
  cover_image: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  is_free: boolean;
  view_count: number;
  created_at: string;
  author_id: string;
  profiles?: {
    full_name: string;
    business_name: string | null;
    profile_image: string | null;
  };
}

const categories = ["All", "Marketing", "Business", "Agriculture", "Technology", "Finance", "Sales"];

export default function Academy() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<LearningPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("learning_posts")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts((data || []) as any);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalStudents = posts.reduce((acc, p) => acc + p.view_count, 0);

  return (
    <>
      <Helmet>
        <title>Smart Academy - Learn & Grow | Smart Market</title>
        <meta name="description" content="Learn digital marketing, business skills, farming techniques, and more with Smart Academy. Free and premium courses to grow your business." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 pb-24">
        <Navbar />

        <main className="pt-[120px] md:pt-20">
          <div className="container mx-auto px-4 lg:px-6 space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-info via-info to-primary p-6 sm:p-8 text-info-foreground">
              <div className="absolute top-0 right-0 w-40 h-40 bg-info-foreground/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-info-foreground/5 rounded-full blur-2xl" />
              
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="p-4 rounded-2xl bg-info-foreground/20 backdrop-blur-sm self-start">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">Smart Academy</h1>
                  <p className="text-info-foreground/80 max-w-xl">
                    Learn practical skills to grow your business. From digital marketing to modern farming techniques.
                  </p>
                </div>
                <div className="flex gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{posts.length}</p>
                    <p className="text-sm opacity-80">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalStudents}+</p>
                    <p className="text-sm opacity-80">Students</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-0"
                />
              </div>
              <Button variant="outline" className="rounded-xl gap-2 h-12">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-info" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No courses found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "Check back soon for new courses!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <CourseCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}

function CourseCard({ post }: { post: LearningPost }) {
  return (
    <Link
      to={`/academy/${post.id}`}
      className="glass-card-hover overflow-hidden group"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-info/20 to-primary/10">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-info/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        
        {/* Play button */}
        {post.video_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-4 rounded-full bg-primary text-primary-foreground shadow-glow">
              <Play className="h-6 w-6 fill-current" />
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {post.is_free ? (
            <span className="px-2.5 py-1 rounded-lg bg-success text-success-foreground text-xs font-semibold shadow-sm">
              FREE
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
              PREMIUM
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <span className="text-xs font-medium text-info uppercase tracking-wider">
            {post.category}
          </span>
          <h3 className="font-semibold text-foreground mt-1 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {post.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground text-xs font-semibold overflow-hidden">
            {post.profiles?.profile_image ? (
              <img src={post.profiles.profile_image} alt="" className="w-full h-full object-cover" />
            ) : (
              post.profiles?.full_name?.charAt(0) || "S"
            )}
          </div>
          <span className="truncate">{post.profiles?.business_name || post.profiles?.full_name || "Smart Market"}</span>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            {post.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.duration_minutes} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {post.view_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}