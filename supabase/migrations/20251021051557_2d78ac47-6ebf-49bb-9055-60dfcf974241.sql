-- Add product_likes table for tracking likes
CREATE TABLE IF NOT EXISTS public.product_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS on product_likes
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for product_likes
CREATE POLICY "Users can view all likes"
  ON public.product_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own likes"
  ON public.product_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON public.product_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add share_count column to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Update the handle_new_user function to set default user type to buyer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  new_referral_code := 'RSM' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  INSERT INTO public.profiles (id, email, full_name, user_type, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    new_referral_code
  );
  RETURN NEW;
END;
$$;