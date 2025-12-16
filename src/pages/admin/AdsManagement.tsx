import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Edit, Image, Type } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Ad {
  id: string;
  type: 'image' | 'text';
  title: string;
  description: string | null;
  image_url: string | null;
  bg_color: string | null;
  text_color: string | null;
  font_size: string | null;
  link: string | null;
  start_date: string;
  end_date: string;
  priority: number;
  is_active: boolean;
}

export default function AdsManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'text' as 'image' | 'text',
    title: '',
    description: '',
    image_url: '',
    bg_color: '#f97316',
    text_color: '#ffffff',
    font_size: 'medium',
    link: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    priority: 0,
    is_active: true
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      navigate("/");
      return;
    }

    await fetchAds();
  };

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("priority", { ascending: false });

    if (!error && data) {
      setAds(data as Ad[]);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ad-images')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ad-images')
      .getPublicUrl(filePath);

    setFormData({ ...formData, image_url: publicUrl });
    setUploading(false);
    toast({ title: "Image uploaded!" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.end_date) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const adData = {
      type: formData.type,
      title: formData.title,
      description: formData.description || null,
      image_url: formData.type === 'image' ? formData.image_url : null,
      bg_color: formData.type === 'text' ? formData.bg_color : null,
      text_color: formData.type === 'text' ? formData.text_color : null,
      font_size: formData.type === 'text' ? formData.font_size : null,
      link: formData.link || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      priority: formData.priority,
      is_active: formData.is_active
    };

    if (editingAd) {
      const { error } = await supabase
        .from("ads")
        .update(adData)
        .eq("id", editingAd.id);

      if (error) {
        toast({ title: "Failed to update ad", variant: "destructive" });
        return;
      }
      toast({ title: "Ad updated!" });
    } else {
      const { error } = await supabase
        .from("ads")
        .insert([adData]);

      if (error) {
        toast({ title: "Failed to create ad", variant: "destructive" });
        return;
      }
      toast({ title: "Ad created!" });
    }

    setIsDialogOpen(false);
    resetForm();
    fetchAds();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad?")) return;

    const { error } = await supabase.from("ads").delete().eq("id", id);

    if (error) {
      toast({ title: "Failed to delete ad", variant: "destructive" });
      return;
    }
    toast({ title: "Ad deleted!" });
    fetchAds();
  };

  const resetForm = () => {
    setEditingAd(null);
    setFormData({
      type: 'text',
      title: '',
      description: '',
      image_url: '',
      bg_color: '#f97316',
      text_color: '#ffffff',
      font_size: 'medium',
      link: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      priority: 0,
      is_active: true
    });
  };

  const openEditDialog = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      type: ad.type,
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url || '',
      bg_color: ad.bg_color || '#f97316',
      text_color: ad.text_color || '#ffffff',
      font_size: ad.font_size || 'medium',
      link: ad.link || '',
      start_date: ad.start_date.split('T')[0],
      end_date: ad.end_date.split('T')[0],
      priority: ad.priority,
      is_active: ad.is_active
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Ads Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Ad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAd ? 'Edit Ad' : 'Create New Ad'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Ad Type</Label>
                  <Select value={formData.type} onValueChange={(v: 'image' | 'text') => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" /> Image Banner
                        </div>
                      </SelectItem>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4" /> Text Ad
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title *</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ad title"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description (max 200 chars)"
                    maxLength={200}
                  />
                </div>

                {formData.type === 'image' ? (
                  <div>
                    <Label>Image</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="mt-2 h-24 rounded" />
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            value={formData.bg_color} 
                            onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input 
                            value={formData.bg_color} 
                            onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            value={formData.text_color} 
                            onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input 
                            value={formData.text_color} 
                            onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Font Size</Label>
                      <Select value={formData.font_size} onValueChange={(v) => setFormData({ ...formData, font_size: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <Label>Link (optional)</Label>
                  <Input 
                    value={formData.link} 
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Input 
                      type="date" 
                      value={formData.start_date} 
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input 
                      type="date" 
                      value={formData.end_date} 
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Priority (higher = more visible)</Label>
                  <Input 
                    type="number" 
                    value={formData.priority} 
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.is_active} 
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingAd ? 'Update Ad' : 'Create Ad'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {ads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No ads yet. Create your first ad!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => (
              <Card key={ad.id} className={!ad.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{ad.title}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(ad)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ad.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {ad.type === 'image' && ad.image_url ? (
                    <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded mb-2" />
                  ) : (
                    <div 
                      className="w-full h-24 rounded mb-2 flex items-center justify-center text-center p-2"
                      style={{ backgroundColor: ad.bg_color || '#f97316', color: ad.text_color || '#fff' }}
                    >
                      {ad.description || ad.title}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Type: {ad.type}</p>
                    <p>Priority: {ad.priority}</p>
                    <p>Dates: {new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}</p>
                    <p>Status: {ad.is_active ? '✅ Active' : '❌ Inactive'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
