import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, Heart } from "lucide-react";
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

// Product validation schema
const productSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  price: z.number()
    .positive('Price must be positive')
    .max(100000000, 'Price is too high'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive')
    .max(100000, 'Quantity is too high'),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().max(200, 'Location is too long').optional(),
  images: z.array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(5, 'Maximum 5 images allowed'),
  video_url: z.string().url('Invalid video URL').optional().or(z.literal('')),
});

export default function SellerProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    location: "",
    images: [] as string[],
    video_url: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile?.user_type !== "seller") {
      navigate("/");
      return;
    }

    await fetchProducts(session.user.id);
    setLoading(false);
  };

  const fetchProducts = async (userId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (!error) {
      setProducts(data || []);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      quantity: "",
      category: "",
      location: "",
      images: [],
      video_url: "",
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Validate form data
    try {
      productSchema.parse({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        location: formData.location,
        images: formData.images,
        video_url: formData.video_url || '',
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
    };

    let error;

    if (editingProduct) {
      const result = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("products")
        .insert({ ...productData, seller_id: session.user.id });
      error = result.error;
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: editingProduct
          ? "Product updated successfully"
          : "Product added successfully",
      });
      resetForm();
      setShowAddDialog(false);
      checkAuth();
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category || "",
      location: product.location || "",
      images: product.images || [],
      video_url: product.video_url || "",
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Product permanently deleted",
      });
      checkAuth();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length && i < (5 - formData.images.length); i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

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
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Products</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Dialog
              open={showAddDialog}
              onOpenChange={(open) => {
                setShowAddDialog(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct
                      ? "Update your product details"
                      : "Create a new product listing"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (RWF)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Images (up to 5)</Label>
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
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(idx)}
                              >
                                ×
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

                  <Button type="submit" className="w-full">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No products yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-primary">
                      {product.price} RWF
                    </span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {product.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {product.likes || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this product from the
                            database. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
