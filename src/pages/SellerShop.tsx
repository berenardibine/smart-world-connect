import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, Save, Upload } from "lucide-react";
import { LocationSelector } from "@/components/LocationSelector";
import { Helmet } from "react-helmet";

interface Shop {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  contact_phone: string;
  contact_email: string;
  province_id: string;
  district_id: string;
  sector_id: string;
  market_center: string;
  is_active: boolean;
}

export default function SellerShop() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [marketCenter, setMarketCenter] = useState("");

  useEffect(() => {
    fetchShop();
  }, []);

  const fetchShop = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("seller_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setShop(data);
        setName(data.name || "");
        setDescription(data.description || "");
        setLogoUrl(data.logo_url || "");
        setContactPhone(data.contact_phone || "");
        setContactEmail(data.contact_email || "");
        setProvinceId(data.province_id || "");
        setDistrictId(data.district_id || "");
        setSectorId(data.sector_id || "");
        setMarketCenter(data.market_center || "");
      }
    } catch (error) {
      console.error("Error fetching shop:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `shop-${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `shops/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("profile-images").getPublicUrl(filePath);
      setLogoUrl(data.publicUrl);
      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Shop name is required", variant: "destructive" });
      return;
    }

    if (!provinceId || !districtId || !sectorId) {
      toast({ title: "Please select your complete location", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const shopData = {
        seller_id: session.user.id,
        name: name.trim(),
        description: description.trim(),
        logo_url: logoUrl,
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        province_id: provinceId,
        district_id: districtId,
        sector_id: sectorId,
        market_center: marketCenter.trim(),
        is_active: true
      };

      if (shop) {
        // Update existing shop
        const { error } = await supabase
          .from("shops")
          .update(shopData)
          .eq("id", shop.id);

        if (error) throw error;
        toast({ title: "Shop updated successfully" });
      } else {
        // Create new shop
        const { data, error } = await supabase
          .from("shops")
          .insert(shopData)
          .select()
          .single();

        if (error) throw error;
        setShop(data);
        toast({ title: "Shop created successfully" });
      }
    } catch (error: any) {
      toast({ title: "Error saving shop", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Shop - Smart Market</title>
        <meta name="description" content="Manage your shop on Smart Market" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{shop ? "Edit Your Shop" : "Create Your Shop"}</CardTitle>
                <CardDescription>
                  Set up your local shop to reach customers in your area
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Shop Logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Shop logo"
                    className="w-20 h-20 rounded-xl object-cover border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center border">
                    <Store className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <span className="cursor-pointer">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {uploading ? "Uploading..." : "Upload Logo"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Shop Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Felix Electronics Shop"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell customers about your shop and what you sell..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Location */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <Label className="text-base font-semibold">Shop Location *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Customers will find your shop based on this location
              </p>
              <LocationSelector
                provinceId={provinceId}
                districtId={districtId}
                sectorId={sectorId}
                onProvinceChange={setProvinceId}
                onDistrictChange={setDistrictId}
                onSectorChange={setSectorId}
                required
              />
              
              {/* Market Center */}
              <div className="mt-4 space-y-2">
                <Label htmlFor="marketCenter">Shop Center / Market Name</Label>
                <Input
                  id="marketCenter"
                  placeholder="e.g., Kimironko Market, MTN Center"
                  value={marketCenter}
                  onChange={(e) => setMarketCenter(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the name of the market or shopping center where your shop is located
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+250780000000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="shop@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {shop ? "Update Shop" : "Create Shop"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}