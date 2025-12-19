import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Heart, Trash2, ArrowLeft, Plus, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShareButton } from "@/components/ShareButton";
import { createProductUrl } from "@/lib/slugify";
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

export default function AdminProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
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

    await fetchProducts();
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (
          full_name,
          business_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
      return;
    }

    setProducts(data || []);
  };

  const handleDelete = async (productId: string) => {
    // Delete the product - this will permanently remove it from database
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete product: " + error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Product permanently deleted from database",
      });
      fetchProducts();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Product Management</h1>
          </div>
          <Button onClick={() => navigate("/admin/post-product")}>
            <Plus className="mr-2 h-4 w-4" />
            Post Product
          </Button>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-3">
            {products.map((product) => {
              const productUrl = `${window.location.origin}${createProductUrl(product.id, product.title)}`;
              return (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted relative">
                    {product.images && product.images[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        className="object-cover w-full h-full"
                      />
                    )}
                    <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      product.status === 'approved' ? 'bg-green-500/80 text-white' :
                      product.status === 'pending' ? 'bg-yellow-500/80 text-white' :
                      'bg-red-500/80 text-white'
                    }`}>
                      {product.status}
                    </div>
                    {product.discount && product.discount > 0 && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Percent className="h-2.5 w-2.5" />
                        {product.discount}%
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2">
                    <h3 className="font-medium text-xs line-clamp-1 mb-1">{product.title}</h3>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary">
                        {product.price.toLocaleString()} RWF
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" />
                          {product.views || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Heart className="h-2.5 w-2.5" />
                          {product.likes || 0}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2 truncate">
                      {product.profiles?.business_name || product.profiles?.full_name || "Unknown"}
                    </p>
                    <div className="flex gap-1">
                      <ShareButton
                        url={productUrl}
                        title={product.title}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-6 text-xs px-1"
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="h-6 px-1">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the product.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
