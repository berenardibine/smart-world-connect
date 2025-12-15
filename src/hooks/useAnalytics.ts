import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supaseClient";

type AnalyticsType = "view" | "impression";

export function useAnalytics() {
  const recordAnalytics = useCallback(async (
    type: AnalyticsType,
    productId: string
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from("product_analytics").insert({
        product_id: productId,
        viewer_id: session?.user?.id || null,
        type,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the UI
      console.error("Analytics error:", error);
    }
  }, []);

  return { recordAnalytics };
}

// Hook for tracking product views with Intersection Observer
export function useProductViewTracker(productId: string, elementRef: React.RefObject<HTMLElement>) {
  const hasTrackedView = useRef(false);
  const { recordAnalytics } = useAnalytics();

  useEffect(() => {
    if (!productId || !elementRef.current || hasTrackedView.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedView.current) {
          // Track after 2 seconds of visibility
          const timer = setTimeout(() => {
            if (entry.isIntersecting) {
              recordAnalytics("view", productId);
              hasTrackedView.current = true;
            }
          }, 2000);

          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [productId, elementRef, recordAnalytics]);
}

// Hook for tracking impressions (clicks)
export function useProductImpression(productId: string) {
  const { recordAnalytics } = useAnalytics();
  
  const trackImpression = useCallback(() => {
    if (productId) {
      recordAnalytics("impression", productId);
    }
  }, [productId, recordAnalytics]);

  // Track impression when product detail is opened
  useEffect(() => {
    if (productId) {
      trackImpression();
    }
  }, [productId, trackImpression]);

  return { trackImpression };
}
