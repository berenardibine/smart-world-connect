import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X } from "lucide-react";
import { z } from "zod";

const categories = [
  "Agriculture Product",
  "Equipment for Lent",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports",
  "Books",
  "Toys",
  "Food & Beverage",
  "Health & Beauty",
  "Automotive",
  "Other",
];

const rentalRateTypes = [
  { value: "per_hour", label: "Per Hour" },
  { value: "per_day", label: "Per Day" },
  { value: "per_week", label: "Per Week" },
  { value: "per_month", label: "Per Month" },
  { value: "per_season", label: "Per Season" },
  { value: "custom", label: "Custom Rate" },
];

const productSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  price: z.number().positive('Price must be positive').max(100000000, 'Price is too high'),
  quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be positive').max(100000, 'Quantity is too high'),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().max(200, 'Location is too long').optional(),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required').max(5, 'Maximum 5 images allowed'),
  contact_whatsapp: z.string().min(10, 'WhatsApp number is required').max(20, 'Invalid phone number'),
  contact_call: z.string().min(10, 'Call number is required').max(20, 'Invalid phone number'),
});

export default function AdminPostProduct() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    location: "",
    images: [] as string[],
    video_url: "",
    is_negotiable: false,
    rental_rate_type: "",
    contact_whatsapp: "",
    contact_call: "",
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

    setAdminId(session.user.id);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) return;

    try {
      productSchema.parse({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        location: formData.location,
        images: formData.images,
        contact_whatsapp: formData.contact_whatsapp,
        contact_call: formData.contact_call,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);

    const productData = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      category: formData.category,
      location: formData.location,
      images: formData.images,
      video_url: formData.video_url || null,
      status: "approved",
      seller_id: adminId,
      is_negotiable: formData.is_negotiable,
      rental_rate_type: formData.category === "Equipment for Lent" ? formData.rental_rate_type : null,
      contact_whatsapp: formData.contact_whatsapp,
      contact_call: formData.contact_call,
    };

    const { error } = await supabase.from("products").insert(productData);

    setSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Product posted successfully",
      });
      navigate("/admin/products");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !adminId) return;

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length && i < (5 - formData.images.length); i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${adminId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
    }

    setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminId) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${adminId}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-videos')
      .upload(filePath, file);

    if (!uploadError && data) {
      const { data: { publicUrl } } = supabase.storage
        .from('product-videos')
        .getPublicUrl(filePath);
      setFormData({ ...formData, video_url: publicUrl });
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Post New Product</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (RWF) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              {/* Contact Numbers - Required for Admin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="contact_whatsapp"
                    value={formData.contact_whatsapp}
                    onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
                    placeholder="+250..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_call">Call Number *</Label>
                  <Input
                    id="contact_call"
                    value={formData.contact_call}
                    onChange={(e) => setFormData({ ...formData, contact_call: e.target.value })}
                    placeholder="+250..."
                    required
                  />
                </div>
              </div>

              {/* Negotiable Price Option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_negotiable"
                  checked={formData.is_negotiable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_negotiable: checked as boolean })
                  }
                />
                <Label htmlFor="is_negotiable" className="text-sm font-medium leading-none">
                  Price is negotiable
                </Label>
              </div>

              {/* Rental Rate Type for Equipment */}
              {formData.category === "Equipment for Lent" && (
                <div className="space-y-2">
                  <Label htmlFor="rental_rate_type">Rental Rate Type *</Label>
                  <Select
                    value={formData.rental_rate_type}
                    onValueChange={(value) => setFormData({ ...formData, rental_rate_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rate type" />
                    </SelectTrigger>
                    <SelectContent>
                      {rentalRateTypes.map((rate) => (
                        <SelectItem key={rate.value} value={rate.value}>
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Images (up to 5) *</Label>
                <div className="space-y-2">
                  {formData.images.length < 5 && (
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload from gallery ({formData.images.length}/5)
                      </p>
                    </div>
                  )}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Product ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeImage(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_upload">Video (Optional)</Label>
                {!formData.video_url ? (
                  <div>
                    <Input
                      id="video_upload"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload from gallery
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <video src={formData.video_url} controls className="w-full h-32 rounded" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, video_url: "" })}
                    >
                      Remove Video
                    </Button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Posting..." : "Post Product"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
