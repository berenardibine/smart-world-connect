import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    site_name: "",
    site_description: "",
    contact_email: "",
    contact_phone: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
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

    await fetchSettings();
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .single();

    if (data) {
      setSettings({
        site_name: data.site_name || "",
        site_description: data.site_description || "",
        contact_email: data.contact_email || "",
        contact_phone: data.contact_phone || "",
        facebook_url: data.facebook_url || "",
        twitter_url: data.twitter_url || "",
        instagram_url: data.instagram_url || "",
      });
    }
  };

  const saveSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from("site_settings")
      .update({
        ...settings,
        updated_by: session?.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (await supabase.from("site_settings").select("id").single()).data?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Website Settings</h1>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Site Name</label>
              <Input
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                placeholder="Rwanda Smart Market"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Site Description</label>
              <Textarea
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                placeholder="Your trusted marketplace in Rwanda"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Contact Email</label>
              <Input
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                placeholder="info@rwandasmartmarket.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Contact Phone</label>
              <Input
                type="tel"
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                placeholder="+250 XXX XXX XXX"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Facebook URL</label>
              <Input
                type="url"
                value={settings.facebook_url}
                onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Twitter URL</label>
              <Input
                type="url"
                value={settings.twitter_url}
                onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                placeholder="https://twitter.com/..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Instagram URL</label>
              <Input
                type="url"
                value={settings.instagram_url}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>

            <Button onClick={saveSettings} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
