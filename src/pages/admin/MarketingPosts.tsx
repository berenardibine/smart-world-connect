import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supaseClient";
import { toast } from "sonner";
import { ArrowLeft, Plus, Upload, X, Trash2, Edit, Eye, EyeOff } from "lucide-react";

interface MarketingPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  link_url: string | null;
  link_text: string;
  post_type: string;
  is_active: boolean;
  views: number;
  created_at: string;
}

const MarketingPosts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    linkUrl: "",
    linkText: "Learn More",
    postType: "announcement",
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      navigate("/");
      return;
    }

    fetchPosts();
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("marketing_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages([...images, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      linkUrl: "",
      linkText: "Learn More",
      postType: "announcement",
    });
    setImages([]);
    setImagePreviews([]);
    setEditingPost(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload images
      const imageUrls: string[] = editingPost?.images || [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `marketing-${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        imageUrls.push(publicUrl);
      }

      const postData = {
        admin_id: user.id,
        title: formData.title,
        content: formData.content,
        link_url: formData.linkUrl || null,
        link_text: formData.linkText,
        post_type: formData.postType,
        images: imageUrls,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("marketing_posts")
          .update(postData)
          .eq("id", editingPost.id);

        if (error) throw error;
        toast.success("Post updated successfully!");
      } else {
        const { error } = await supabase
          .from("marketing_posts")
          .insert(postData);

        if (error) throw error;
        toast.success("Post created successfully!");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save post");
    } finally {
      setFormLoading(false);
    }
  };

  const togglePostStatus = async (post: MarketingPost) => {
    const { error } = await supabase
      .from("marketing_posts")
      .update({ is_active: !post.is_active })
      .eq("id", post.id);

    if (error) {
      toast.error("Failed to update post status");
    } else {
      toast.success(post.is_active ? "Post hidden" : "Post activated");
      fetchPosts();
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const { error } = await supabase
      .from("marketing_posts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted");
      fetchPosts();
    }
  };

  const openEditDialog = (post: MarketingPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      linkUrl: post.link_url || "",
      linkText: post.link_text,
      postType: post.post_type,
    });
    setImagePreviews(post.images || []);
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold">Marketing Posts</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPost ? "Edit Post" : "Create Marketing Post"}</DialogTitle>
                <DialogDescription>
                  Create announcements and promotional content that appears in the Opportunities section
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Follow us on WhatsApp Channel!"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your announcement or promotional content..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="postType">Post Type *</Label>
                  <Select value={formData.postType} onValueChange={(value) => setFormData({ ...formData, postType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="follow-channel">Follow Channel</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="linkUrl">Link URL (Optional)</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="e.g., https://whatsapp.com/channel/..."
                  />
                </div>

                <div>
                  <Label htmlFor="linkText">Button Text</Label>
                  <Input
                    id="linkText"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    placeholder="e.g., Follow Now"
                  />
                </div>

                <div>
                  <Label htmlFor="images">Images (Optional)</Label>
                  <div className="mt-2">
                    <label htmlFor="images" className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                      <div className="flex flex-col items-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="mt-1 text-sm text-muted-foreground">Upload Images</span>
                      </div>
                      <input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img src={preview} alt={`Preview ${index}`} className="w-full h-20 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={formLoading} className="w-full">
                  {formLoading ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Marketing Posts</CardTitle>
            <CardDescription>Manage announcements, promotions, and channel follow requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.post_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.is_active ? "default" : "secondary"}>
                        {post.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.views}</TableCell>
                    <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => togglePostStatus(post)}>
                          {post.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePost(post.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {posts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No marketing posts yet. Create your first one!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketingPosts;