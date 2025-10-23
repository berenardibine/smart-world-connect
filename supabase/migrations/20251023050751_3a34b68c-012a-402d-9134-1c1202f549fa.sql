-- Add admin delete policies for products
DROP POLICY IF EXISTS "Admins can delete any product" ON public.products;
CREATE POLICY "Admins can delete any product"
  ON public.products
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin update policy for products
DROP POLICY IF EXISTS "Admins can update any product" ON public.products;
CREATE POLICY "Admins can update any product"
  ON public.products
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add constraint to ensure one like per user per product
DO $$ 
BEGIN
  ALTER TABLE public.product_likes
  ADD CONSTRAINT unique_user_product_like UNIQUE (user_id, product_id);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;

-- Add constraint to ensure one rating per user per seller
DO $$ 
BEGIN
  ALTER TABLE public.product_ratings
  ADD CONSTRAINT unique_user_seller_rating UNIQUE (user_id, seller_id);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;

-- Create function to handle user status checks
CREATE OR REPLACE FUNCTION public.check_user_status(user_uuid UUID)
RETURNS TABLE (
  status TEXT,
  blocking_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.status, p.blocking_reason
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$;