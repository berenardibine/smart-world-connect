import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Image as ImageIcon, Upload, Loader2, 
  Lock, Globe, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

export default function CommunityCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: true,
    join_approval_required: false,
    posting_permission: "all_members",
    rules: [] as string[],
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const handleFileChange = (type: "logo" | "cover", file: File | null) => {
    if (!file) return;
    
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const fullPath = `${path}/${fileName}`;
    
    const { error } = await supabase.storage
      .from("profile-images")
      .upload(fullPath, file);
    
    if (error) throw error;
    
    const { data } = supabase.storage
      .from("profile-images")
      .getPublicUrl(fullPath);
    
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Community name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Please sign in", variant: "destructive" });
        navigate("/auth");
        return;
      }

      let logoUrl = null;
      let coverUrl = null;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile, "community-logos");
      }
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, "community-covers");
      }

      const { data, error } = await supabase
        .from("communities")
        .insert({
          name: formData.name,
          description: formData.description,
          is_public: formData.is_public,
          join_approval_required: formData.join_approval_required,
          posting_permission: formData.posting_permission,
          rules: formData.rules,
          logo_image: logoUrl,
          cover_image: coverUrl,
          seller_id: session.user.id,
          member_count: 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as first member
      await supabase
        .from("community_members")
        .insert({
          community_id: data.id,
          user_id: session.user.id,
          role: "admin"
        });

      toast({ title: "Success!", description: "Community created successfully" });
      navigate(`/community/${data.id}`);
    } catch (error: any) {
      console.error("Error creating community:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create community", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Community - Smart Market</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg">Create Community</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div 
                className="h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                onClick={() => document.getElementById("cover-input")?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-sm">Upload cover image</span>
                  </div>
                )}
              </div>
              <input
                id="cover-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange("cover", e.target.files?.[0] || null)}
              />
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                  onClick={() => document.getElementById("logo-input")?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Upload your community logo</p>
                  <p>Recommended: 200x200px</p>
                </div>
              </div>
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange("logo", e.target.files?.[0] || null)}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Community Name *</Label>
              <Input
                id="name"
                placeholder="Enter community name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your community..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px] rounded-xl resize-none"
              />
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Privacy Settings
              </h3>
              
              <div className="glass-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-info" />
                    <div>
                      <p className="font-medium">Public Community</p>
                      <p className="text-sm text-muted-foreground">Anyone can find and join</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium">Require Approval</p>
                      <p className="text-sm text-muted-foreground">Approve members before they join</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.join_approval_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, join_approval_required: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-5 w-5 mr-2" />
                  Create Community
                </>
              )}
            </Button>
          </form>
        </main>
      </div>
    </>
  );
}
