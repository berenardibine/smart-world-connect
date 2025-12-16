-- Add expire_date to opportunities
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS expire_date timestamp with time zone;

-- Add discount fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_expiry timestamp with time zone;

-- Add last_active to profiles for real-time status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();

-- Create comments table for products and sellers
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments"
ON public.comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_comments_product_id ON public.comments(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_seller_id ON public.comments(seller_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active);
CREATE INDEX IF NOT EXISTS idx_products_discount ON public.products(discount) WHERE discount > 0;
CREATE INDEX IF NOT EXISTS idx_opportunities_expire_date ON public.opportunities(expire_date);