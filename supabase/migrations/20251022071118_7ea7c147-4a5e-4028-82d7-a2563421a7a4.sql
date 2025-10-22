-- Add unique constraint to product_likes to ensure one like per user per product
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_likes_user_id_product_id_key'
  ) THEN
    ALTER TABLE public.product_likes ADD CONSTRAINT product_likes_user_id_product_id_key UNIQUE (user_id, product_id);
  END IF;
END $$;

-- Ensure product_ratings has unique constraint for one rating per user per product
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_ratings_user_id_product_id_key'
  ) THEN
    ALTER TABLE public.product_ratings ADD CONSTRAINT product_ratings_user_id_product_id_key UNIQUE (user_id, product_id);
  END IF;
END $$;

-- Add admin RLS policies for full delete access
DROP POLICY IF EXISTS "Admins can delete any product" ON public.products;
CREATE POLICY "Admins can delete any product" 
ON public.products 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.profiles;
CREATE POLICY "Admins can delete user profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update profiles RLS - split into separate policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update safe profile fields" ON public.profiles;

-- Regular users can only update non-sensitive fields
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update everything
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update profiles SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view limited profile info" ON public.profiles;

CREATE POLICY "Anyone can view limited profile info"
ON public.profiles
FOR SELECT
USING (true);

-- Add function to track product impressions
CREATE OR REPLACE FUNCTION increment_product_view(product_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE id = product_uuid;
END;
$$;