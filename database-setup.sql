-- =============================================
-- COMPLETE DATABASE SETUP FOR RWANDA SMART MARKET
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. CREATE ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TYPE public.product_category AS ENUM (
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Toys & Games',
  'Books',
  'Automotive',
  'Health & Beauty',
  'Food & Beverages',
  'Other',
  'Agriculture Product',
  'Equipment for Lent'
);

-- 2. CREATE TABLES
-- =============================================

-- User Roles Table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles Table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  business_name text,
  bio text,
  location text,
  user_type text NOT NULL DEFAULT 'buyer',
  profile_image text,
  referral_code text,
  status text DEFAULT 'active',
  phone_number text,
  whatsapp_number text,
  call_number text,
  blocking_reason text,
  rating numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  identity_verified boolean DEFAULT false,
  id_front_photo text,
  id_back_photo text,
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products Table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  quantity integer NOT NULL,
  images text[] NOT NULL,
  category text,
  location text,
  status text DEFAULT 'pending',
  video_url text,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  share_count integer DEFAULT 0,
  impressions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product Likes Table
CREATE TABLE public.product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, product_id)
);

-- Product Ratings Table
CREATE TABLE public.product_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, seller_id)
);

-- Conversations Table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages Table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Updates Table (Seller Posts)
CREATE TABLE public.updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  images text[] DEFAULT '{}',
  video_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Opportunities Table
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  title text NOT NULL,
  company_name text NOT NULL,
  location text NOT NULL,
  salary text,
  job_type text NOT NULL,
  description text NOT NULL,
  requirements text,
  contact_email text,
  apply_link text,
  images text[] DEFAULT '{}',
  video_url text,
  status text DEFAULT 'approved',
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Plans Table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_rwf integer NOT NULL,
  post_limit_monthly integer NOT NULL,
  updates_limit_monthly integer NOT NULL,
  can_edit_product boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Subscriptions Table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  status text DEFAULT 'active' NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription Requests Table
CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  requested_plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  amount_rwf integer NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  payment_reference text,
  phone_paid_to text,
  message text,
  admin_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Seller Activity Table
CREATE TABLE public.seller_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  posts_this_month integer DEFAULT 0 NOT NULL,
  updates_this_month integer DEFAULT 0 NOT NULL,
  edits_this_month integer DEFAULT 0 NOT NULL,
  last_reset_date timestamptz DEFAULT date_trunc('month', now()) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications Table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Admin Messages Table
CREATE TABLE public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Marketing Posts Table
CREATE TABLE public.marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  images text[] DEFAULT '{}',
  video_url text,
  link_url text,
  link_text text DEFAULT 'Learn More',
  post_type text DEFAULT 'announcement' NOT NULL,
  is_active boolean DEFAULT true,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Site Settings Table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text DEFAULT 'Rwanda Smart Market',
  site_description text,
  contact_email text,
  contact_phone text,
  facebook_url text,
  twitter_url text,
  instagram_url text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

-- 3. CREATE PUBLIC PROFILES VIEW (for safe public access)
-- =============================================
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  business_name,
  bio,
  location,
  user_type,
  profile_image,
  referral_code,
  rating,
  rating_count,
  created_at
FROM public.profiles;

-- 4. CREATE FUNCTIONS
-- =============================================

-- Has Role Function (Security Definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Handle New User Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  new_referral_code := 'RSM' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  INSERT INTO public.profiles (id, email, full_name, user_type, referral_code, phone_number, whatsapp_number, call_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    new_referral_code,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'whatsapp_number',
    NEW.raw_user_meta_data->>'call_number'
  );
  RETURN NEW;
END;
$$;

-- Update Timestamp Function
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update Seller Rating Function
CREATE OR REPLACE FUNCTION public.update_seller_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM public.product_ratings
      WHERE seller_id = NEW.seller_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.product_ratings
      WHERE seller_id = NEW.seller_id
    )
  WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$;

-- Increment Product View Function
CREATE OR REPLACE FUNCTION public.increment_product_view(product_uuid uuid)
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

-- Increment Opportunity View Function
CREATE OR REPLACE FUNCTION public.increment_opportunity_view(opportunity_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.opportunities
  SET views = COALESCE(views, 0) + 1
  WHERE id = opportunity_uuid;
END;
$$;

-- Update Conversation Timestamp Function
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Check User Status Function
CREATE OR REPLACE FUNCTION public.check_user_status(user_uuid uuid)
RETURNS TABLE(status text, blocking_reason text)
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

-- Reset Monthly Activity Function
CREATE OR REPLACE FUNCTION public.reset_monthly_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.seller_activity
  SET 
    posts_this_month = 0,
    updates_this_month = 0,
    edits_this_month = 0,
    last_reset_date = date_trunc('month', now())
  WHERE last_reset_date < date_trunc('month', now());
END;
$$;

-- Can User Perform Action Function
CREATE OR REPLACE FUNCTION public.can_user_perform_action(_user_id uuid, _action_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan RECORD;
  user_activity RECORD;
BEGIN
  PERFORM public.reset_monthly_activity();
  
  SELECT p.* INTO user_plan
  FROM public.plans p
  INNER JOIN public.user_subscriptions us ON us.plan_id = p.id
  WHERE us.user_id = _user_id 
    AND us.status = 'active'
    AND p.is_active = true
  LIMIT 1;
  
  IF user_plan IS NULL THEN
    SELECT * INTO user_plan
    FROM public.plans
    WHERE key = 'free'
    LIMIT 1;
  END IF;
  
  SELECT * INTO user_activity
  FROM public.seller_activity
  WHERE user_id = _user_id;
  
  IF user_activity IS NULL THEN
    INSERT INTO public.seller_activity (user_id)
    VALUES (_user_id)
    RETURNING * INTO user_activity;
  END IF;
  
  IF _action_type = 'post' THEN
    IF user_plan.post_limit_monthly = -1 THEN
      RETURN true;
    END IF;
    RETURN user_activity.posts_this_month < user_plan.post_limit_monthly;
  ELSIF _action_type = 'update' THEN
    IF user_plan.updates_limit_monthly = -1 THEN
      RETURN true;
    END IF;
    RETURN user_activity.updates_this_month < user_plan.updates_limit_monthly;
  ELSIF _action_type = 'edit' THEN
    RETURN user_plan.can_edit_product;
  END IF;
  
  RETURN false;
END;
$$;

-- Record User Action Function
CREATE OR REPLACE FUNCTION public.record_user_action(_user_id uuid, _action_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.seller_activity (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  IF _action_type = 'post' THEN
    UPDATE public.seller_activity
    SET posts_this_month = posts_this_month + 1
    WHERE user_id = _user_id;
  ELSIF _action_type = 'update' THEN
    UPDATE public.seller_activity
    SET updates_this_month = updates_this_month + 1
    WHERE user_id = _user_id;
  ELSIF _action_type = 'edit' THEN
    UPDATE public.seller_activity
    SET edits_this_month = edits_this_month + 1
    WHERE user_id = _user_id;
  END IF;
END;
$$;

-- Validate Profile Update Function
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  
  IF auth.uid() = NEW.id THEN
    NEW.status := OLD.status;
    NEW.rating := OLD.rating;
    NEW.rating_count := OLD.rating_count;
    NEW.user_type := OLD.user_type;
    NEW.email := OLD.email;
    NEW.phone_number := OLD.phone_number;
    NEW.whatsapp_number := OLD.whatsapp_number;
    NEW.call_number := OLD.call_number;
    
    RETURN NEW;
  END IF;
  
  RAISE EXCEPTION 'Unauthorized profile update';
END;
$$;

-- 5. CREATE TRIGGERS
-- =============================================

-- New User Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile Update Validation Trigger
CREATE TRIGGER validate_profile_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_update();

-- Update Timestamps Triggers
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_updates_timestamp
  BEFORE UPDATE ON public.updates
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_opportunities_timestamp
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_plans_timestamp
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_user_subscriptions_timestamp
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_seller_activity_timestamp
  BEFORE UPDATE ON public.seller_activity
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_marketing_posts_timestamp
  BEFORE UPDATE ON public.marketing_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Seller Rating Trigger
CREATE TRIGGER update_seller_rating_trigger
  AFTER INSERT ON public.product_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_seller_rating();

-- Conversation Timestamp Trigger
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- 6. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
-- =============================================

-- User Roles Policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Profiles Policies
CREATE POLICY "Public can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any user profile" ON public.profiles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Products Policies
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Sellers can insert their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY "Admins can update any product" ON public.products
  FOR UPDATE USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any product" ON public.products
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Product Likes Policies
CREATE POLICY "Users can view all likes" ON public.product_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can add their own likes" ON public.product_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.product_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Product Ratings Policies
CREATE POLICY "Anyone can view ratings" ON public.product_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings for products they don't own" ON public.product_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() <> seller_id);

-- Conversations Policies
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Messages Policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their messages" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Updates Policies
CREATE POLICY "Updates are viewable by everyone" ON public.updates
  FOR SELECT USING (true);

CREATE POLICY "Sellers can create their own updates" ON public.updates
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own updates" ON public.updates
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own updates" ON public.updates
  FOR DELETE USING (auth.uid() = seller_id);

-- Opportunities Policies
CREATE POLICY "Opportunities are viewable by everyone" ON public.opportunities
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert opportunities" ON public.opportunities
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update opportunities" ON public.opportunities
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete opportunities" ON public.opportunities
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Plans Policies
CREATE POLICY "Everyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User Subscriptions Policies
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Subscription Requests Policies
CREATE POLICY "Users can view their own requests" ON public.subscription_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON public.subscription_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own requests" ON public.subscription_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update requests" ON public.subscription_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Seller Activity Policies
CREATE POLICY "Users can view their own activity" ON public.seller_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON public.seller_activity
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert activity" ON public.seller_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update activity" ON public.seller_activity
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin Messages Policies
CREATE POLICY "Admins can view all admin messages" ON public.admin_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can send messages to admin" ON public.admin_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Marketing Posts Policies
CREATE POLICY "Everyone can view active marketing posts" ON public.marketing_posts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage marketing posts" ON public.marketing_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Site Settings Policies
CREATE POLICY "Everyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings" ON public.site_settings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings" ON public.site_settings
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- 8. CREATE STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-videos', 'product-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('seller-id-photos', 'seller-id-photos', false);

-- Storage Policies for product-images
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for profile-images
CREATE POLICY "Anyone can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile image" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile image" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for seller-id-photos (private)
CREATE POLICY "Users can upload their own ID photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'seller-id-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own ID photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'seller-id-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all ID photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'seller-id-photos' AND has_role(auth.uid(), 'admin'));

-- 9. INSERT DEFAULT DATA
-- =============================================

-- Insert default plans
INSERT INTO public.plans (key, name, description, price_rwf, post_limit_monthly, updates_limit_monthly, can_edit_product) VALUES
  ('free', 'Free Plan', 'Basic plan for new sellers', 0, 3, 2, false),
  ('basic', 'Basic Plan', 'Standard plan for active sellers', 5000, 10, 5, true),
  ('premium', 'Premium Plan', 'Premium plan for professional sellers', 15000, 30, 15, true),
  ('enterprise', 'Enterprise Plan', 'Unlimited access for businesses', 50000, -1, -1, true);

-- Insert default site settings
INSERT INTO public.site_settings (site_name, site_description) VALUES
  ('Rwanda Smart Market', 'Your trusted marketplace for buying and selling in Rwanda');

-- 10. ENABLE REALTIME (Optional)
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
