
-- Create referrals table for tracking seller referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  is_valid boolean DEFAULT true,
  is_seller_referral boolean DEFAULT false,
  status text DEFAULT 'pending', -- pending, active, invalid
  created_at timestamp with time zone DEFAULT now(),
  validated_at timestamp with time zone,
  UNIQUE(referred_user_id)
);

-- Create referral_logs table for AI Manager tracking
CREATE TABLE IF NOT EXISTS public.referral_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES public.referrals(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL, -- valid, invalid, suspected
  reason text,
  detected_by text DEFAULT 'AI Manager',
  created_at timestamp with time zone DEFAULT now()
);

-- Add referred_by column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
    ALTER TABLE public.profiles ADD COLUMN referred_by text;
  END IF;
END $$;

-- Modify marketing_posts table to support seller marketing
ALTER TABLE public.marketing_posts 
ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS duration text DEFAULT 'week',
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'; -- pending, active, expired, rejected

-- Create marketing_analytics table
CREATE TABLE IF NOT EXISTS public.marketing_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  conversion_score numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, date)
);

-- Create AI manager reports table
CREATE TABLE IF NOT EXISTS public.ai_manager_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL, -- weekly_summary, fraud_alert, performance_alert
  title text NOT NULL,
  content text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create AI suggestions table for sellers
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL, -- referral_tip, marketing_tip, performance_tip
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_manager_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Sellers can view their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referred_user_id);

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update referrals"
ON public.referrals FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for referral_logs
CREATE POLICY "Admins can view referral logs"
ON public.referral_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert referral logs"
ON public.referral_logs FOR INSERT
WITH CHECK (true);

-- RLS Policies for marketing_analytics
CREATE POLICY "Sellers can view their own analytics"
ON public.marketing_analytics FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all analytics"
ON public.marketing_analytics FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage analytics"
ON public.marketing_analytics FOR ALL
USING (true);

-- RLS Policies for ai_manager_reports
CREATE POLICY "Admins can view AI reports"
ON public.ai_manager_reports FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update AI reports"
ON public.ai_manager_reports FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert AI reports"
ON public.ai_manager_reports FOR INSERT
WITH CHECK (true);

-- RLS Policies for ai_suggestions
CREATE POLICY "Sellers can view their own suggestions"
ON public.ai_suggestions FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own suggestions"
ON public.ai_suggestions FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "System can insert suggestions"
ON public.ai_suggestions FOR INSERT
WITH CHECK (true);

-- Update marketing_posts policies to allow sellers
CREATE POLICY "Sellers can manage their own marketing posts"
ON public.marketing_posts FOR ALL
USING (auth.uid() = seller_id);

-- Function to validate referral and create record
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referral_code text,
  p_referred_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referrer_type text;
  v_referral_id uuid;
  v_result jsonb;
BEGIN
  -- Find the referrer by code
  SELECT id, user_type INTO v_referrer_id, v_referrer_type
  FROM profiles
  WHERE referral_code = p_referral_code;
  
  -- Check if referral code exists
  IF v_referrer_id IS NULL THEN
    INSERT INTO referral_logs (referral_code, status, reason)
    VALUES (p_referral_code, 'invalid', 'Referral code not found');
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  -- Check if referrer is a seller
  IF v_referrer_type != 'seller' THEN
    INSERT INTO referral_logs (referral_code, status, reason)
    VALUES (p_referral_code, 'invalid', 'Referrer is not a seller');
    RETURN jsonb_build_object('success', false, 'error', 'Only sellers can refer new users');
  END IF;
  
  -- Check for self-referral
  IF v_referrer_id = p_referred_user_id THEN
    INSERT INTO referral_logs (referral_code, status, reason)
    VALUES (p_referral_code, 'suspected', 'Self-referral detected');
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;
  
  -- Check if user already has a referral
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a referral');
  END IF;
  
  -- Create the referral
  INSERT INTO referrals (referrer_id, referred_user_id, referral_code, is_seller_referral, status)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, true, 'active')
  RETURNING id INTO v_referral_id;
  
  -- Update the referred user's profile
  UPDATE profiles SET referred_by = p_referral_code WHERE id = p_referred_user_id;
  
  -- Log successful referral
  INSERT INTO referral_logs (referral_id, referral_code, status, reason)
  VALUES (v_referral_id, p_referral_code, 'valid', 'Referral successfully processed');
  
  RETURN jsonb_build_object('success', true, 'referral_id', v_referral_id);
END;
$$;

-- Function to expire old marketing posts
CREATE OR REPLACE FUNCTION public.expire_marketing_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE marketing_posts
  SET is_active = false, status = 'expired'
  WHERE end_date < now() AND is_active = true;
END;
$$;

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(p_impressions integer, p_clicks integer)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_impressions = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((p_clicks::numeric / p_impressions::numeric) * 100, 2);
END;
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_manager_reports;
