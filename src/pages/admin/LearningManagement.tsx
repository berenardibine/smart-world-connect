import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Video,
  Eye,
  Clock,
} from "lucide-react";

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
  is_published: boolean;
  view_count: number;
  created_at: string;
}

const categories = [
  "Marketing",
  "Sales",
  "Product Photography",
  "Customer Service",
  "Business Growth",
  "Social Media",
  "Agriculture",
  "Finance",
];

export default function LearningManagement() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<LearningPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<LearningPost | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    category: "",
    cover_image: "",
    video_url: "",
    duration_minutes: "",
    is_free: true,
    is_published: true,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("learning_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
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

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      content: "",
      category: "",
      cover_image: "",
      video_url: "",
      duration_minutes: "",
      is_free: true,
      is_published: true,
    });
    setEditingPost(null);
  };

  const openEditDialog = (post: LearningPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      description: post.description,
      content: post.content || "",
      category: post.category,
      cover_image: post.cover_image || "",
      video_url: post.video_url || "",
      duration_minutes: post.duration_minutes?.toString() || "",
      is_free: post.is_free ?? true,
      is_published: post.is_published ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const postData = {
        title: form.title,
        description: form.description,
        content: form.content || null,
        category: form.category,
        cover_image: form.cover_image || null,
        video_url: form.video_url || null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        is_free: form.is_free,
        is_published: form.is_published,
        author_id: session.user.id,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("learning_posts")
          .update(postData)
          .eq("id", editingPost.id);
        
        if (error) throw error;
        toast({ title: "Learning post updated!" });
      } else {
        const { error } = await supabase
          .from("learning_posts")
          .insert(postData);
        
        if (error) throw error;
        toast({ title: "Learning post created!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase
        .from("learning_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Post deleted" });
      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("learning_posts")
        .update({ is_published: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast({ title: currentStatus ? "Post unpublished" : "Post published" });
      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Smart Academy</h1>
              <p className="text-sm text-muted-foreground">Manage learning content</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPost ? "Edit Learning Post" : "Create Learning Post"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="How to boost your sales"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Short Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief overview of what users will learn"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Full Content</Label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Detailed lesson content..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cover Image URL</Label>
                  <Input
                    value={form.cover_image}
                    onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                    placeholder="15"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Free Content</Label>
                  <Switch
                    checked={form.is_free}
                    onCheckedChange={(checked) => setForm({ ...form, is_free: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Published</Label>
                  <Switch
                    checked={form.is_published}
                    onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No learning posts yet</p>
              <p className="text-sm text-muted-foreground">Create your first educational content</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {post.video_url ? (
                          <Video className="h-8 w-8 text-primary" />
                        ) : (
                          <BookOpen className="h-8 w-8 text-primary" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {post.description}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(post)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <Badge variant="secondary">{post.category}</Badge>
                        {post.is_free ? (
                          <Badge variant="outline" className="text-green-600">Free</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600">Premium</Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.view_count}
                        </span>
                        {post.duration_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.duration_minutes} min
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        <Button
                          variant={post.is_published ? "outline" : "default"}
                          size="sm"
                          onClick={() => togglePublish(post.id, post.is_published ?? true)}
                        >
                          {post.is_published ? "Unpublish" : "Publish"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
