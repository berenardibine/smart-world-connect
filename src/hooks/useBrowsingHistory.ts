import { useEffect } from "react";
import { supabase } from "@/lib/supaseClient";

export function useBrowsingHistory(productId: string | undefined) {
  useEffect(() => {
    const trackView = async () => {
      if (!productId) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Upsert browsing history - update viewed_at if exists, insert if not
      await supabase
        .from("user_browsing_history")
        .upsert(
          { 
            user_id: session.user.id, 
            product_id: productId,
            viewed_at: new Date().toISOString()
          },
          { onConflict: "user_id,product_id" }
        );
    };
    
    trackView();
  }, [productId]);
}
