import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Users, Image as ImageIcon, Upload, Loader2, 
  Lock, Globe, Info, Trash2, UserX, Shield, Crown, Settings,
  Edit3, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

interface CommunityMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    full_name: string;
    profile_image: string | null;
    email: string;
  };
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  logo_image: string | null;
  member_count: number;
  seller_id: string;
  is_public: boolean;
  join_approval_required: boolean;
  posting_permission: string;
  posting_mode: string;
  rules: string[];
}

export default function CommunitySettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: true,
    join_approval_required: false,
    posting_permission: "all_members",
    posting_mode: "all_members",
    allow_member_messaging: true,
    rules: [] as string[],
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [newRule, setNewRule] = useState("");

  useEffect(() => {
    if (id) {
      loadCommunity();
      loadMembers();
    }
  }, [id]);

  const loadCommunity = async () => {
    try {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Check if current user is the owner
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.id !== data.seller_id) {
        toast({ title: "Access denied", variant: "destructive" });
        navigate("/community");
        return;
      }

      setCommunity(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        is_public: data.is_public,
        join_approval_required: data.join_approval_required,
        posting_permission: data.posting_permission || "all_members",
        posting_mode: data.posting_mode || "all_members",
        allow_member_messaging: data.allow_member_messaging ?? true,
        rules: data.rules || [],
      });
      setLogoPreview(data.logo_image || "");
      setCoverPreview(data.cover_image || "");
    } catch (error) {
      console.error("Error loading community:", error);
      toast({ title: "Error loading community", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data: membersData, error } = await supabase
        .from("community_members")
        .select("*")
        .eq("community_id", id)
        .order("joined_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from("public_profiles")
          .select("id, full_name, profile_image")
          .in("id", userIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const membersWithProfiles = membersData.map(member => ({
          ...member,
          profiles: profilesMap.get(member.user_id) || { full_name: "Unknown", profile_image: null, email: "" }
        }));
        
        setMembers(membersWithProfiles as CommunityMember[]);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

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

  const handleSave = async () => {
    if (!community) return;
    setSaving(true);

    try {
      let logoUrl = community.logo_image;
      let coverUrl = community.cover_image;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile, "community-logos");
      }
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, "community-covers");
      }

      const { error } = await supabase
        .from("communities")
        .update({
          name: formData.name,
          description: formData.description,
          is_public: formData.is_public,
          join_approval_required: formData.join_approval_required,
          posting_permission: formData.posting_permission,
          allow_member_messaging: formData.allow_member_messaging,
          rules: formData.rules,
          logo_image: logoUrl,
          cover_image: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", community.id);

      if (error) throw error;

      toast({ title: "Community updated successfully!" });
      loadCommunity();
    } catch (error: any) {
      console.error("Error updating community:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleMemberRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("community_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;
      toast({ title: "Member role updated" });
      loadMembers();
    } catch (error) {
      console.error("Error updating member role:", error);
      toast({ title: "Error updating role", variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      toast({ title: "Member removed" });
      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({ title: "Error removing member", variant: "destructive" });
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community) return;

    try {
      // Delete all members first
      await supabase
        .from("community_members")
        .delete()
        .eq("community_id", community.id);

      // Delete community
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", community.id);

      if (error) throw error;

      toast({ title: "Community deleted" });
      navigate("/community");
    } catch (error) {
      console.error("Error deleting community:", error);
      toast({ title: "Error deleting community", variant: "destructive" });
    }
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Community not found</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Community Settings - Smart World Connect</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <h1 className="font-semibold text-lg">Community Settings</h1>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 p-1 rounded-2xl w-full mb-6">
              <TabsTrigger value="general" className="flex-1 rounded-xl gap-2">
                <Edit3 className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1 rounded-xl gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex-1 rounded-xl gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
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

              {/* Rules */}
              <div className="space-y-2">
                <Label>Community Rules</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a rule..."
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                    className="h-12 rounded-xl"
                  />
                  <Button type="button" onClick={addRule} className="h-12 px-6 rounded-xl">
                    Add
                  </Button>
                </div>
                {formData.rules.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {formData.rules.map((rule, index) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <span className="text-sm">{index + 1}. {rule}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Community
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Community?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the community
                        and remove all members.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCommunity} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              {members.length === 0 ? (
                <div className="text-center py-12 glass-card">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 glass-card">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profiles?.profile_image || undefined} />
                          <AvatarFallback>
                            {member.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.profiles?.full_name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        {member.role === "admin" && (
                          <Badge variant="secondary" className="gap-1">
                            <Crown className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      
                      {member.user_id !== community.seller_id && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleMemberRoleChange(member.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <UserX className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.profiles?.full_name} from the community?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-6">
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Allow Member Messaging</p>
                      <p className="text-sm text-muted-foreground">Members can send messages in the group chat</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.allow_member_messaging}
                    onCheckedChange={(checked) => setFormData({ ...formData, allow_member_messaging: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Who can post?</Label>
                <Select
                  value={formData.posting_permission}
                  onValueChange={(value) => setFormData({ ...formData, posting_permission: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_members">All Members</SelectItem>
                    <SelectItem value="moderators_only">Moderators & Admins Only</SelectItem>
                    <SelectItem value="admins_only">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
