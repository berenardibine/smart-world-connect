-- Create shops table for local shop system
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  province_id UUID REFERENCES public.provinces(id),
  district_id UUID REFERENCES public.districts(id),
  sector_id UUID REFERENCES public.sectors(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add shop_id to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id);

-- Create PWA install log table
CREATE TABLE public.pwa_installs_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add PWA columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS installed_pwa BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ;

-- Create push notification subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on all new tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwa_installs_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shops
CREATE POLICY "Anyone can view active shops" ON public.shops
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can create their own shops" ON public.shops
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own shops" ON public.shops
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own shops" ON public.shops
  FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all shops" ON public.shops
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for pwa_installs_log
CREATE POLICY "Users can insert their own install logs" ON public.pwa_installs_log
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own install logs" ON public.pwa_installs_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all install logs" ON public.pwa_installs_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for shops updated_at
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Improve process_referral function to be more permissive
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code text, p_referred_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id uuid;
  v_referrer_type text;
  v_referral_id uuid;
BEGIN
  -- Normalize the referral code (uppercase, trim)
  p_referral_code := UPPER(TRIM(p_referral_code));
  
  -- Find the referrer by code
  SELECT id, user_type INTO v_referrer_id, v_referrer_type
  FROM profiles
  WHERE UPPER(referral_code) = p_referral_code;
  
  -- Check if referral code exists
  IF v_referrer_id IS NULL THEN
    INSERT INTO referral_logs (referral_code, status, reason)
    VALUES (p_referral_code, 'invalid', 'Referral code not found');
    RETURN jsonb_build_object('success', false, 'error', 'Referral code not found. Please check and try again.');
  END IF;
  
  -- Check if referrer is a seller
  IF v_referrer_type != 'seller' THEN
    INSERT INTO referral_logs (referral_code, status, reason)
    VALUES (p_referral_code, 'invalid', 'Referrer is not a seller');
    RETURN jsonb_build_object('success', false, 'error', 'This referral code is not from an active seller.');
  END IF;
  
  -- Check for self-referral
  IF v_referrer_id = p_referred_user_id THEN
    INSERT INTO referral_logs (referral_code, status, reason)
    VALUES (p_referral_code, 'suspected', 'Self-referral detected');
    RETURN jsonb_build_object('success', false, 'error', 'You cannot use your own referral code.');
  END IF;
  
  -- Check if user already has a referral
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Referral already applied to your account.');
  END IF;
  
  -- Create the referral
  INSERT INTO referrals (referrer_id, referred_user_id, referral_code, is_seller_referral, status, is_valid)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, true, 'active', true)
  RETURNING id INTO v_referral_id;
  
  -- Update the referred user's profile
  UPDATE profiles SET referred_by = p_referral_code WHERE id = p_referred_user_id;
  
  -- Log successful referral
  INSERT INTO referral_logs (referral_id, referral_code, status, reason)
  VALUES (v_referral_id, p_referral_code, 'valid', 'Referral successfully processed');
  
  RETURN jsonb_build_object('success', true, 'referral_id', v_referral_id, 'message', 'Referral applied successfully!');
END;
$$;

-- Function to validate referral code before signup
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id uuid;
  v_referrer_type text;
  v_referrer_name text;
BEGIN
  -- Normalize the referral code
  p_referral_code := UPPER(TRIM(p_referral_code));
  
  -- Find the referrer by code
  SELECT id, user_type, full_name INTO v_referrer_id, v_referrer_type, v_referrer_name
  FROM profiles
  WHERE UPPER(referral_code) = p_referral_code;
  
  -- Check if referral code exists
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Referral code not found');
  END IF;
  
  -- Check if referrer is a seller
  IF v_referrer_type != 'seller' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This code is not from an active seller');
  END IF;
  
  RETURN jsonb_build_object('valid', true, 'referrer_name', v_referrer_name);
END;
$$;