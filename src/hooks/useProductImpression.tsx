import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProductImpression(productId: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackImpression = async () => {
      if (!hasTracked.current && productId) {
        try {
          const { data: product } = await supabase
            .from('products')
            .select('impressions')
            .eq('id', productId)
            .single();
          
          if (product) {
            await supabase
              .from('products')
              .update({ 
                impressions: (product.impressions || 0) + 1 
              })
              .eq('id', productId);
          }
          
          hasTracked.current = true;
        } catch (error) {
          console.error('Error tracking impression:', error);
        }
      }
    };

    trackImpression();
  }, [productId]);
}
