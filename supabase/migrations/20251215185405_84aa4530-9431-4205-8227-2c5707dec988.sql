-- Create product_analytics table for views and impressions tracking
CREATE TABLE IF NOT EXISTS public.product_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    viewer_id uuid,
    type text NOT NULL CHECK (type IN ('view', 'impression')),
    created_at timestamp with time zone DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_product_analytics_product_id ON public.product_analytics(product_id);
CREATE INDEX idx_product_analytics_type ON public.product_analytics(type);
CREATE INDEX idx_product_analytics_created_at ON public.product_analytics(created_at);

-- Enable RLS
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics (for tracking)
CREATE POLICY "Anyone can insert analytics" 
ON public.product_analytics 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view analytics for their own products
CREATE POLICY "Sellers can view their product analytics" 
ON public.product_analytics 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.products 
        WHERE products.id = product_analytics.product_id 
        AND products.seller_id = auth.uid()
    )
);

-- Allow admins to view all analytics
CREATE POLICY "Admins can view all analytics" 
ON public.product_analytics 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));