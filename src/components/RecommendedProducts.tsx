import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  seller_id: string;
  category: string;
  description: string;
}

interface RecommendedProductsProps {
  currentProductId: string;
  productTitle: string;
  productCategory: string;
  productDescription: string;
}

export function RecommendedProducts({ 
  currentProductId, 
  productTitle, 
  productCategory,
  productDescription 
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Get AI recommendations
        const { data: aiData } = await supabase.functions.invoke('product-recommendations', {
          body: { productTitle, productCategory, productDescription }
        });

        // Fetch similar products based on category first
        const { data: similarProducts, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'approved')
          .eq('category', productCategory)
          .neq('id', currentProductId)
          .limit(4);

        if (error) throw error;

        setProducts(similarProducts || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        
        // Fallback: just show products from same category
        const { data: fallbackProducts } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'approved')
          .eq('category', productCategory)
          .neq('id', currentProductId)
          .limit(4);
        
        setProducts(fallbackProducts || []);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId, productTitle, productCategory, productDescription]);

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">You May Like These</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">You May Like These</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            id={product.id}
            title={product.title}
            price={product.price}
            images={product.images}
            location={product.location}
            sellerName=""
          />
        ))}
      </div>
    </div>
  );
}
