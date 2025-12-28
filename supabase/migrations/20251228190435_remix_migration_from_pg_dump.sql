CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: product_category; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: calculate_engagement_score(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_engagement_score(p_impressions integer, p_clicks integer) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_impressions = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((p_clicks::numeric / p_impressions::numeric) * 100, 2);
END;
$$;


--
-- Name: can_user_perform_action(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_user_perform_action(_user_id uuid, _action_type text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_plan RECORD;
  user_activity RECORD;
BEGIN
  -- Reset activity if new month
  PERFORM public.reset_monthly_activity();
  
  -- Get user's current plan
  SELECT p.* INTO user_plan
  FROM public.plans p
  INNER JOIN public.user_subscriptions us ON us.plan_id = p.id
  WHERE us.user_id = _user_id 
    AND us.status = 'active'
    AND p.is_active = true
  LIMIT 1;
  
  -- If no plan found, default to free plan
  IF user_plan IS NULL THEN
    SELECT * INTO user_plan
    FROM public.plans
    WHERE key = 'free'
    LIMIT 1;
  END IF;
  
  -- Get user's activity
  SELECT * INTO user_activity
  FROM public.seller_activity
  WHERE user_id = _user_id;
  
  -- If no activity record, create one
  IF user_activity IS NULL THEN
    INSERT INTO public.seller_activity (user_id)
    VALUES (_user_id)
    RETURNING * INTO user_activity;
  END IF;
  
  -- Check limits based on action type
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


--
-- Name: check_user_status(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_status(user_uuid uuid) RETURNS TABLE(status text, blocking_reason text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT p.status, p.blocking_reason
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$;


--
-- Name: expire_marketing_posts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.expire_marketing_posts() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE marketing_posts
  SET is_active = false, status = 'expired'
  WHERE end_date < now() AND is_active = true;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: increment_opportunity_view(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_opportunity_view(opportunity_uuid uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.opportunities
  SET views = COALESCE(views, 0) + 1
  WHERE id = opportunity_uuid;
END;
$$;


--
-- Name: increment_product_view(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_product_view(product_uuid uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE id = product_uuid;
END;
$$;


--
-- Name: process_referral(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_referral(p_referral_code text, p_referred_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: record_user_action(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_user_action(_user_id uuid, _action_type text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Ensure activity record exists
  INSERT INTO public.seller_activity (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update activity based on action type
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


--
-- Name: reset_monthly_activity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_monthly_activity() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: sync_product_views(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_product_views() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.type = 'view' THEN
    UPDATE products
    SET views = COALESCE(views, 0) + 1
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_community_member_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_community_member_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_seller_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_seller_rating() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: validate_profile_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_profile_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Allow admins to update anything
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, prevent changes to admin-managed fields and phone numbers
  IF auth.uid() = NEW.id THEN
    -- Restore admin-managed fields to their original values
    NEW.status := OLD.status;
    NEW.rating := OLD.rating;
    NEW.rating_count := OLD.rating_count;
    NEW.user_type := OLD.user_type;
    NEW.email := OLD.email;
    
    -- Prevent users from editing phone numbers once set (only admin can edit)
    NEW.phone_number := OLD.phone_number;
    NEW.whatsapp_number := OLD.whatsapp_number;
    NEW.call_number := OLD.call_number;
    
    RETURN NEW;
  END IF;
  
  -- Deny updates from other users (shouldn't reach here due to RLS)
  RAISE EXCEPTION 'Unauthorized profile update';
END;
$$;


--
-- Name: validate_referral_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_referral_code(p_referral_code text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


SET default_table_access_method = heap;

--
-- Name: admin_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false
);


--
-- Name: ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    bg_color text DEFAULT '#f97316'::text,
    text_color text DEFAULT '#ffffff'::text,
    font_size text DEFAULT 'medium'::text,
    link text,
    start_date timestamp with time zone DEFAULT now() NOT NULL,
    end_date timestamp with time zone NOT NULL,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT ads_type_check CHECK ((type = ANY (ARRAY['image'::text, 'text'::text])))
);


--
-- Name: ai_manager_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_manager_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    report_type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid,
    suggestion_type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    seller_id uuid,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    rating integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comments_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    cover_image text,
    logo_image text,
    seller_id uuid NOT NULL,
    is_public boolean DEFAULT true,
    member_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    rules text[] DEFAULT '{}'::text[],
    posting_permission text DEFAULT 'all_members'::text,
    join_approval_required boolean DEFAULT false
);


--
-- Name: community_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'moderator'::text, 'member'::text])))
);


--
-- Name: community_post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: community_post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: community_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    images text[] DEFAULT '{}'::text[],
    video_url text,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_pinned boolean DEFAULT false
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone_number text,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: districts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.districts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    province_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: learning_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    content text,
    category text NOT NULL,
    cover_image text,
    video_url text,
    duration_minutes integer,
    author_id uuid NOT NULL,
    is_free boolean DEFAULT true,
    is_published boolean DEFAULT true,
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: link_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.link_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid,
    source text DEFAULT 'direct'::text,
    event text DEFAULT 'view'::text NOT NULL,
    referrer text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: marketing_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    seller_id uuid,
    date date DEFAULT CURRENT_DATE,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    conversion_score numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: marketing_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    images text[] DEFAULT '{}'::text[],
    video_url text,
    link_url text,
    link_text text DEFAULT 'Learn More'::text,
    post_type text DEFAULT 'announcement'::text NOT NULL,
    is_active boolean DEFAULT true,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    seller_id uuid,
    product_id uuid,
    duration text DEFAULT 'week'::text,
    start_date timestamp with time zone DEFAULT now(),
    end_date timestamp with time zone,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversion_score numeric DEFAULT 0,
    status text DEFAULT 'pending'::text
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    delivered_at timestamp with time zone
);


--
-- Name: notification_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    badge_type text NOT NULL,
    count integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text, 'error'::text])))
);


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    images text[] DEFAULT '{}'::text[],
    video_url text,
    status text DEFAULT 'approved'::text,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expire_date timestamp with time zone
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    price_rwf integer NOT NULL,
    post_limit_monthly integer NOT NULL,
    updates_limit_monthly integer NOT NULL,
    can_edit_product boolean DEFAULT false NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: product_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    viewer_id uuid,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_analytics_type_check CHECK ((type = ANY (ARRAY['view'::text, 'impression'::text])))
);


--
-- Name: product_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    product_id uuid NOT NULL,
    rating integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT rating_range CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    images text[] NOT NULL,
    category text,
    location text,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    video_url text,
    share_count integer DEFAULT 0,
    impressions integer DEFAULT 0,
    is_negotiable boolean DEFAULT false,
    rental_rate_type text,
    contact_whatsapp text,
    contact_call text,
    discount numeric DEFAULT 0,
    discount_expiry timestamp with time zone,
    shop_id uuid,
    CONSTRAINT products_description_check CHECK ((length(description) <= 1000)),
    CONSTRAINT products_images_check CHECK (((array_length(images, 1) >= 1) AND (array_length(images, 1) <= 5))),
    CONSTRAINT products_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT products_quantity_check CHECK ((quantity >= 0)),
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    business_name text,
    bio text,
    location text,
    user_type text NOT NULL,
    profile_image text,
    rating numeric(3,2) DEFAULT 0,
    rating_count integer DEFAULT 0,
    referral_code text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text,
    phone_number text,
    blocking_reason text,
    whatsapp_number text,
    call_number text,
    id_front_photo text,
    id_back_photo text,
    identity_verified boolean DEFAULT false,
    verification_notes text,
    last_active timestamp with time zone DEFAULT now(),
    referred_by text,
    province_id uuid,
    district_id uuid,
    sector_id uuid,
    installed_pwa boolean DEFAULT false,
    installed_at timestamp with time zone,
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'blocked'::text, 'banned'::text]))),
    CONSTRAINT profiles_user_type_check CHECK ((user_type = ANY (ARRAY['buyer'::text, 'seller'::text])))
);


--
-- Name: provinces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provinces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: public_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_profiles WITH (security_invoker='true') AS
 SELECT id,
    full_name,
    business_name,
    bio,
    location,
    user_type,
    profile_image,
    rating,
    rating_count,
    created_at,
    referral_code
   FROM public.profiles;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pwa_installs_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pwa_installs_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: referral_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referral_id uuid,
    referral_code text NOT NULL,
    status text NOT NULL,
    reason text,
    detected_by text DEFAULT 'AI Manager'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid,
    referred_user_id uuid,
    referral_code text NOT NULL,
    is_valid boolean DEFAULT true,
    is_seller_referral boolean DEFAULT false,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    validated_at timestamp with time zone
);


--
-- Name: reward_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    reward_points integer DEFAULT 0 NOT NULL,
    reward_coins integer DEFAULT 0 NOT NULL,
    task_type text NOT NULL,
    requirement_count integer DEFAULT 1,
    icon text,
    color text,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    requires_evidence boolean DEFAULT false,
    category text DEFAULT 'general'::text,
    CONSTRAINT reward_tasks_task_type_check CHECK ((task_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'challenge'::text, 'achievement'::text])))
);


--
-- Name: sectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sectors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    district_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: seller_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    posts_this_month integer DEFAULT 0 NOT NULL,
    updates_this_month integer DEFAULT 0 NOT NULL,
    edits_this_month integer DEFAULT 0 NOT NULL,
    last_reset_date timestamp with time zone DEFAULT date_trunc('month'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: shops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shops (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    contact_phone text,
    contact_email text,
    province_id uuid,
    district_id uuid,
    sector_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_name text DEFAULT 'Rwanda Smart Market'::text,
    site_description text,
    contact_email text,
    contact_phone text,
    facebook_url text,
    twitter_url text,
    instagram_url text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: subscription_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    requested_plan_id uuid NOT NULL,
    amount_rwf integer NOT NULL,
    payment_reference text,
    phone_paid_to text,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    admin_note text,
    CONSTRAINT subscription_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    content text NOT NULL,
    images text[] DEFAULT '{}'::text[],
    video_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text
);


--
-- Name: user_browsing_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_browsing_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    coins integer DEFAULT 0,
    points integer DEFAULT 0,
    streak_days integer DEFAULT 0,
    last_login_date date,
    level integer DEFAULT 1,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    badge text DEFAULT 'Bronze'::text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text])))
);


--
-- Name: user_task_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_task_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid NOT NULL,
    progress integer DEFAULT 0,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    claimed boolean DEFAULT false,
    claimed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    evidence_url text,
    evidence_text text,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    status text DEFAULT 'pending'::text
);


--
-- Name: admin_messages admin_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_pkey PRIMARY KEY (id);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: ai_manager_reports ai_manager_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_manager_reports
    ADD CONSTRAINT ai_manager_reports_pkey PRIMARY KEY (id);


--
-- Name: ai_suggestions ai_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_suggestions
    ADD CONSTRAINT ai_suggestions_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: community_members community_members_community_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_community_id_user_id_key UNIQUE (community_id, user_id);


--
-- Name: community_members community_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_pkey PRIMARY KEY (id);


--
-- Name: community_post_comments community_post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_post_comments
    ADD CONSTRAINT community_post_comments_pkey PRIMARY KEY (id);


--
-- Name: community_post_likes community_post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_post_likes
    ADD CONSTRAINT community_post_likes_pkey PRIMARY KEY (id);


--
-- Name: community_post_likes community_post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_post_likes
    ADD CONSTRAINT community_post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: community_posts community_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_posts
    ADD CONSTRAINT community_posts_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: districts districts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_pkey PRIMARY KEY (id);


--
-- Name: districts districts_province_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_province_id_name_key UNIQUE (province_id, name);


--
-- Name: learning_posts learning_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_posts
    ADD CONSTRAINT learning_posts_pkey PRIMARY KEY (id);


--
-- Name: link_analytics link_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_analytics
    ADD CONSTRAINT link_analytics_pkey PRIMARY KEY (id);


--
-- Name: marketing_analytics marketing_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_analytics
    ADD CONSTRAINT marketing_analytics_pkey PRIMARY KEY (id);


--
-- Name: marketing_analytics marketing_analytics_post_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_analytics
    ADD CONSTRAINT marketing_analytics_post_id_date_key UNIQUE (post_id, date);


--
-- Name: marketing_posts marketing_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_posts
    ADD CONSTRAINT marketing_posts_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_badges notification_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_badges
    ADD CONSTRAINT notification_badges_pkey PRIMARY KEY (id);


--
-- Name: notification_badges notification_badges_user_id_badge_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_badges
    ADD CONSTRAINT notification_badges_user_id_badge_type_key UNIQUE (user_id, badge_type);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: plans plans_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_key_key UNIQUE (key);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: product_analytics product_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_analytics
    ADD CONSTRAINT product_analytics_pkey PRIMARY KEY (id);


--
-- Name: product_likes product_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_likes
    ADD CONSTRAINT product_likes_pkey PRIMARY KEY (id);


--
-- Name: product_likes product_likes_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_likes
    ADD CONSTRAINT product_likes_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: product_ratings product_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ratings
    ADD CONSTRAINT product_ratings_pkey PRIMARY KEY (id);


--
-- Name: product_ratings product_ratings_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ratings
    ADD CONSTRAINT product_ratings_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: provinces provinces_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_name_key UNIQUE (name);


--
-- Name: provinces provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- Name: pwa_installs_log pwa_installs_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pwa_installs_log
    ADD CONSTRAINT pwa_installs_log_pkey PRIMARY KEY (id);


--
-- Name: referral_logs referral_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_logs
    ADD CONSTRAINT referral_logs_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referred_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_key UNIQUE (referred_user_id);


--
-- Name: reward_tasks reward_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_tasks
    ADD CONSTRAINT reward_tasks_pkey PRIMARY KEY (id);


--
-- Name: sectors sectors_district_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_district_id_name_key UNIQUE (district_id, name);


--
-- Name: sectors sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);


--
-- Name: seller_activity seller_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_activity
    ADD CONSTRAINT seller_activity_pkey PRIMARY KEY (id);


--
-- Name: seller_activity seller_activity_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_activity
    ADD CONSTRAINT seller_activity_user_id_key UNIQUE (user_id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: subscription_requests subscription_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_requests
    ADD CONSTRAINT subscription_requests_pkey PRIMARY KEY (id);


--
-- Name: product_likes unique_user_product_like; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_likes
    ADD CONSTRAINT unique_user_product_like UNIQUE (user_id, product_id);


--
-- Name: user_browsing_history unique_user_product_view; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_browsing_history
    ADD CONSTRAINT unique_user_product_view UNIQUE (user_id, product_id);


--
-- Name: product_ratings unique_user_seller_rating; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ratings
    ADD CONSTRAINT unique_user_seller_rating UNIQUE (user_id, seller_id);


--
-- Name: updates updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.updates
    ADD CONSTRAINT updates_pkey PRIMARY KEY (id);


--
-- Name: user_browsing_history user_browsing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_browsing_history
    ADD CONSTRAINT user_browsing_history_pkey PRIMARY KEY (id);


--
-- Name: user_rewards user_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_pkey PRIMARY KEY (id);


--
-- Name: user_rewards user_rewards_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: user_task_progress user_task_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_task_progress
    ADD CONSTRAINT user_task_progress_pkey PRIMARY KEY (id);


--
-- Name: user_task_progress user_task_progress_user_id_task_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_task_progress
    ADD CONSTRAINT user_task_progress_user_id_task_id_key UNIQUE (user_id, task_id);


--
-- Name: idx_ads_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_active ON public.ads USING btree (is_active, start_date, end_date);


--
-- Name: idx_ads_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_priority ON public.ads USING btree (priority DESC);


--
-- Name: idx_browsing_history_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_browsing_history_product ON public.user_browsing_history USING btree (product_id);


--
-- Name: idx_browsing_history_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_browsing_history_user ON public.user_browsing_history USING btree (user_id);


--
-- Name: idx_browsing_history_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_browsing_history_viewed_at ON public.user_browsing_history USING btree (viewed_at DESC);


--
-- Name: idx_comments_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_product_id ON public.comments USING btree (product_id);


--
-- Name: idx_comments_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_seller_id ON public.comments USING btree (seller_id);


--
-- Name: idx_districts_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_districts_province ON public.districts USING btree (province_id);


--
-- Name: idx_link_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_link_analytics_created_at ON public.link_analytics USING btree (created_at);


--
-- Name: idx_link_analytics_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_link_analytics_product_id ON public.link_analytics USING btree (product_id);


--
-- Name: idx_link_analytics_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_link_analytics_source ON public.link_analytics USING btree (source);


--
-- Name: idx_opportunities_expire_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_expire_date ON public.opportunities USING btree (expire_date);


--
-- Name: idx_product_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_analytics_created_at ON public.product_analytics USING btree (created_at);


--
-- Name: idx_product_analytics_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_analytics_product_id ON public.product_analytics USING btree (product_id);


--
-- Name: idx_product_analytics_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_analytics_type ON public.product_analytics USING btree (type);


--
-- Name: idx_products_discount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_discount ON public.products USING btree (discount) WHERE (discount > (0)::numeric);


--
-- Name: idx_profiles_district; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_district ON public.profiles USING btree (district_id);


--
-- Name: idx_profiles_identity_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_identity_verified ON public.profiles USING btree (identity_verified);


--
-- Name: idx_profiles_last_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_last_active ON public.profiles USING btree (last_active);


--
-- Name: idx_profiles_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_province ON public.profiles USING btree (province_id);


--
-- Name: idx_profiles_sector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_sector ON public.profiles USING btree (sector_id);


--
-- Name: idx_sectors_district; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sectors_district ON public.sectors USING btree (district_id);


--
-- Name: profiles enforce_safe_profile_updates; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_safe_profile_updates BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_update();


--
-- Name: product_analytics trigger_sync_product_views; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_product_views AFTER INSERT ON public.product_analytics FOR EACH ROW EXECUTE FUNCTION public.sync_product_views();


--
-- Name: messages update_conversation_on_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


--
-- Name: community_members update_member_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_member_count_trigger AFTER INSERT OR DELETE ON public.community_members FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();


--
-- Name: opportunities update_opportunities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: plans update_plans_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_plans_timestamp BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_activity update_seller_activity_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seller_activity_timestamp BEFORE UPDATE ON public.seller_activity FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: product_ratings update_seller_rating_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seller_rating_trigger AFTER INSERT ON public.product_ratings FOR EACH ROW EXECUTE FUNCTION public.update_seller_rating();


--
-- Name: shops update_shops_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: updates update_updates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_updates_updated_at BEFORE UPDATE ON public.updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_subscriptions update_user_subscriptions_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_subscriptions_timestamp BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: admin_messages admin_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ads ads_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: ai_suggestions ai_suggestions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_suggestions
    ADD CONSTRAINT ai_suggestions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: comments comments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: comments comments_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: communities communities_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: community_members community_members_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_members community_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: community_post_comments community_post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_post_comments
    ADD CONSTRAINT community_post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;


--
-- Name: community_post_comments community_post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_post_comments
    ADD CONSTRAINT community_post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: community_post_likes community_post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_post_likes
    ADD CONSTRAINT community_post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;


--
-- Name: community_post_likes community_post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_post_likes
    ADD CONSTRAINT community_post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: community_posts community_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_posts
    ADD CONSTRAINT community_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: community_posts community_posts_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_posts
    ADD CONSTRAINT community_posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: districts districts_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE CASCADE;


--
-- Name: learning_posts learning_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_posts
    ADD CONSTRAINT learning_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: link_analytics link_analytics_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_analytics
    ADD CONSTRAINT link_analytics_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: marketing_analytics marketing_analytics_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_analytics
    ADD CONSTRAINT marketing_analytics_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.marketing_posts(id) ON DELETE CASCADE;


--
-- Name: marketing_analytics marketing_analytics_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_analytics
    ADD CONSTRAINT marketing_analytics_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: marketing_posts marketing_posts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_posts
    ADD CONSTRAINT marketing_posts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: marketing_posts marketing_posts_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_posts
    ADD CONSTRAINT marketing_posts_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: product_analytics product_analytics_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_analytics
    ADD CONSTRAINT product_analytics_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_likes product_likes_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_likes
    ADD CONSTRAINT product_likes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_likes product_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_likes
    ADD CONSTRAINT product_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: product_ratings product_ratings_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ratings
    ADD CONSTRAINT product_ratings_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_ratings product_ratings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ratings
    ADD CONSTRAINT product_ratings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: product_ratings product_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ratings
    ADD CONSTRAINT product_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: products products_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: products products_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: profiles profiles_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id);


--
-- Name: profiles profiles_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pwa_installs_log pwa_installs_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pwa_installs_log
    ADD CONSTRAINT pwa_installs_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: referral_logs referral_logs_referral_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_logs
    ADD CONSTRAINT referral_logs_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES public.referrals(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reward_tasks reward_tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_tasks
    ADD CONSTRAINT reward_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: sectors sectors_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE CASCADE;


--
-- Name: seller_activity seller_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_activity
    ADD CONSTRAINT seller_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: shops shops_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id);


--
-- Name: shops shops_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id);


--
-- Name: shops shops_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);


--
-- Name: shops shops_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: site_settings site_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: subscription_requests subscription_requests_requested_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_requests
    ADD CONSTRAINT subscription_requests_requested_plan_id_fkey FOREIGN KEY (requested_plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: subscription_requests subscription_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_requests
    ADD CONSTRAINT subscription_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: subscription_requests subscription_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_requests
    ADD CONSTRAINT subscription_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: updates updates_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.updates
    ADD CONSTRAINT updates_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_browsing_history user_browsing_history_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_browsing_history
    ADD CONSTRAINT user_browsing_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: user_rewards user_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_task_progress user_task_progress_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_task_progress
    ADD CONSTRAINT user_task_progress_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.reward_tasks(id) ON DELETE CASCADE;


--
-- Name: user_task_progress user_task_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_task_progress
    ADD CONSTRAINT user_task_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: opportunities Admins can delete any opportunity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any opportunity" ON public.opportunities FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can delete any product; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any product" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can delete any user profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any user profile" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_messages Admins can delete contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete contact messages" ON public.contact_messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can delete user profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete user profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notifications Admins can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_settings Admins can insert site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ads Admins can manage ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage ads" ON public.ads USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: communities Admins can manage all communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all communities" ON public.communities USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: learning_posts Admins can manage all learning posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all learning posts" ON public.learning_posts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: shops Admins can manage all shops; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all shops" ON public.shops USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: districts Admins can manage districts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage districts" ON public.districts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: marketing_posts Admins can manage marketing posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage marketing posts" ON public.marketing_posts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: plans Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.plans USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: provinces Admins can manage provinces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage provinces" ON public.provinces USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sectors Admins can manage sectors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sectors" ON public.sectors USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_subscriptions Admins can manage subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ai_manager_reports Admins can update AI reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update AI reports" ON public.ai_manager_reports FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: opportunities Admins can update any opportunity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any opportunity" ON public.opportunities FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can update any product; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any product" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_messages Admins can update contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update contact messages" ON public.contact_messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referrals Admins can update referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update referrals" ON public.referrals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_requests Admins can update requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update requests" ON public.subscription_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_settings Admins can update site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ai_manager_reports Admins can view AI reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view AI reports" ON public.ai_manager_reports FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seller_activity Admins can view all activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all activity" ON public.seller_activity FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_messages Admins can view all admin messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all admin messages" ON public.admin_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: link_analytics Admins can view all analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all analytics" ON public.link_analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: marketing_analytics Admins can view all analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all analytics" ON public.marketing_analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_analytics Admins can view all analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all analytics" ON public.product_analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pwa_installs_log Admins can view all install logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all install logs" ON public.pwa_installs_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referrals Admins can view all referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_requests Admins can view all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all requests" ON public.subscription_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_rewards Admins can view all rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all rewards" ON public.user_rewards FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_messages Admins can view contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_logs Admins can view referral logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view referral logs" ON public.referral_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: link_analytics Anyone can insert analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert analytics" ON public.link_analytics FOR INSERT WITH CHECK (true);


--
-- Name: product_analytics Anyone can insert analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert analytics" ON public.product_analytics FOR INSERT WITH CHECK (true);


--
-- Name: contact_messages Anyone can submit contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: ads Anyone can view active ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active ads" ON public.ads FOR SELECT USING (((is_active = true) AND (start_date <= now()) AND (end_date > now())));


--
-- Name: reward_tasks Anyone can view active reward tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active reward tasks" ON public.reward_tasks FOR SELECT USING ((is_active = true));


--
-- Name: shops Anyone can view active shops; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active shops" ON public.shops FOR SELECT USING ((is_active = true));


--
-- Name: comments Anyone can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);


--
-- Name: community_post_comments Anyone can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comments" ON public.community_post_comments FOR SELECT USING (true);


--
-- Name: community_members Anyone can view community members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view community members" ON public.community_members FOR SELECT USING (true);


--
-- Name: community_posts Anyone can view community posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view community posts" ON public.community_posts FOR SELECT USING (true);


--
-- Name: districts Anyone can view districts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view districts" ON public.districts FOR SELECT USING (true);


--
-- Name: community_post_likes Anyone can view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view likes" ON public.community_post_likes FOR SELECT USING (true);


--
-- Name: provinces Anyone can view provinces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view provinces" ON public.provinces FOR SELECT USING (true);


--
-- Name: communities Anyone can view public communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view public communities" ON public.communities FOR SELECT USING ((is_public = true));


--
-- Name: learning_posts Anyone can view published learning posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published learning posts" ON public.learning_posts FOR SELECT USING ((is_published = true));


--
-- Name: product_ratings Anyone can view ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view ratings" ON public.product_ratings FOR SELECT USING (true);


--
-- Name: sectors Anyone can view sectors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view sectors" ON public.sectors FOR SELECT USING (true);


--
-- Name: comments Authenticated users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: community_posts Authors can delete their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can delete their posts" ON public.community_posts FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: learning_posts Authors can manage their learning posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can manage their learning posts" ON public.learning_posts USING ((auth.uid() = author_id));


--
-- Name: community_posts Authors can update their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can update their posts" ON public.community_posts FOR UPDATE USING ((auth.uid() = author_id));


--
-- Name: conversations Buyers can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can create conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: community_members Community owners can manage members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owners can manage members" ON public.community_members USING ((EXISTS ( SELECT 1
   FROM public.communities c
  WHERE ((c.id = community_members.community_id) AND (c.seller_id = auth.uid())))));


--
-- Name: communities Community owners can manage their communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community owners can manage their communities" ON public.communities USING ((auth.uid() = seller_id));


--
-- Name: marketing_posts Everyone can view active marketing posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active marketing posts" ON public.marketing_posts FOR SELECT USING ((is_active = true));


--
-- Name: plans Everyone can view active plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active plans" ON public.plans FOR SELECT USING ((is_active = true));


--
-- Name: site_settings Everyone can view site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view site settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: community_posts Members can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can create posts" ON public.community_posts FOR INSERT WITH CHECK (((auth.uid() = author_id) AND (EXISTS ( SELECT 1
   FROM public.community_members cm
  WHERE ((cm.community_id = community_posts.community_id) AND (cm.user_id = auth.uid()))))));


--
-- Name: opportunities Only admins can delete opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete opportunities" ON public.opportunities FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: opportunities Only admins can insert opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert opportunities" ON public.opportunities FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reward_tasks Only admins can manage reward tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage reward tasks" ON public.reward_tasks USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: opportunities Only admins can update opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update opportunities" ON public.opportunities FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: opportunities Opportunities are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Opportunities are viewable by everyone" ON public.opportunities FOR SELECT USING (true);


--
-- Name: products Products are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);


--
-- Name: profiles Public can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: shops Sellers can create their own shops; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can create their own shops" ON public.shops FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: updates Sellers can create their own updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can create their own updates" ON public.updates FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: products Sellers can delete their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can delete their own products" ON public.products FOR DELETE USING ((auth.uid() = seller_id));


--
-- Name: shops Sellers can delete their own shops; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can delete their own shops" ON public.shops FOR DELETE USING ((auth.uid() = seller_id));


--
-- Name: updates Sellers can delete their own updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can delete their own updates" ON public.updates FOR DELETE USING ((auth.uid() = seller_id));


--
-- Name: products Sellers can insert their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can insert their own products" ON public.products FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: marketing_posts Sellers can manage their own marketing posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can manage their own marketing posts" ON public.marketing_posts USING ((auth.uid() = seller_id));


--
-- Name: products Sellers can update their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update their own products" ON public.products FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: shops Sellers can update their own shops; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update their own shops" ON public.shops FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: ai_suggestions Sellers can update their own suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update their own suggestions" ON public.ai_suggestions FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: updates Sellers can update their own updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update their own updates" ON public.updates FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: marketing_analytics Sellers can view their own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view their own analytics" ON public.marketing_analytics FOR SELECT USING ((auth.uid() = seller_id));


--
-- Name: referrals Sellers can view their own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view their own referrals" ON public.referrals FOR SELECT USING ((auth.uid() = referrer_id));


--
-- Name: ai_suggestions Sellers can view their own suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view their own suggestions" ON public.ai_suggestions FOR SELECT USING ((auth.uid() = seller_id));


--
-- Name: link_analytics Sellers can view their product analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view their product analytics" ON public.link_analytics FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = link_analytics.product_id) AND (products.seller_id = auth.uid())))));


--
-- Name: product_analytics Sellers can view their product analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view their product analytics" ON public.product_analytics FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = product_analytics.product_id) AND (products.seller_id = auth.uid())))));


--
-- Name: ai_manager_reports System can insert AI reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert AI reports" ON public.ai_manager_reports FOR INSERT WITH CHECK (true);


--
-- Name: seller_activity System can insert activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert activity" ON public.seller_activity FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: notification_badges System can insert badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert badges" ON public.notification_badges FOR INSERT WITH CHECK (true);


--
-- Name: referral_logs System can insert referral logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert referral logs" ON public.referral_logs FOR INSERT WITH CHECK (true);


--
-- Name: referrals System can insert referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);


--
-- Name: ai_suggestions System can insert suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert suggestions" ON public.ai_suggestions FOR INSERT WITH CHECK (true);


--
-- Name: marketing_analytics System can manage analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can manage analytics" ON public.marketing_analytics USING (true);


--
-- Name: seller_activity System can update activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can update activity" ON public.seller_activity FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: updates Updates are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Updates are viewable by everyone" ON public.updates FOR SELECT USING (true);


--
-- Name: community_post_comments Users can add comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add comments" ON public.community_post_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: community_post_likes Users can add likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add likes" ON public.community_post_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: product_likes Users can add their own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add their own likes" ON public.product_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: product_ratings Users can create ratings for products they don't own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create ratings for products they don't own" ON public.product_ratings FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (auth.uid() <> seller_id)));


--
-- Name: subscription_requests Users can create their own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own requests" ON public.subscription_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: community_post_comments Users can delete their comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their comments" ON public.community_post_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: comments Users can delete their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_browsing_history Users can insert their own browsing history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own browsing history" ON public.user_browsing_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: pwa_installs_log Users can insert their own install logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own install logs" ON public.pwa_installs_log FOR INSERT WITH CHECK (((auth.uid() = user_id) OR (user_id IS NULL)));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: community_members Users can join communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: community_members Users can leave communities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave communities" ON public.community_members FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can manage their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions USING ((auth.uid() = user_id));


--
-- Name: community_post_likes Users can remove their likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove their likes" ON public.community_post_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: product_likes Users can remove their own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove their own likes" ON public.product_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: messages Users can send messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.buyer_id = auth.uid()) OR (conversations.seller_id = auth.uid())))))));


--
-- Name: admin_messages Users can send messages to admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages to admin" ON public.admin_messages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: user_rewards Users can update own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own rewards" ON public.user_rewards FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: messages Users can update their messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their messages" ON public.messages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.buyer_id = auth.uid()) OR (conversations.seller_id = auth.uid()))))));


--
-- Name: notification_badges Users can update their own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own badges" ON public.notification_badges FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_browsing_history Users can update their own browsing history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own browsing history" ON public.user_browsing_history FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: comments Users can update their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_task_progress Users can update their own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own progress" ON public.user_task_progress FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_rewards Users can update their own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own rewards" ON public.user_rewards FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_task_progress Users can update their progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their progress" ON public.user_task_progress FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: product_likes Users can view all likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all likes" ON public.product_likes FOR SELECT USING (true);


--
-- Name: messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.buyer_id = auth.uid()) OR (conversations.seller_id = auth.uid()))))));


--
-- Name: referrals Users can view referrals where they are referred; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view referrals where they are referred" ON public.referrals FOR SELECT USING ((auth.uid() = referred_user_id));


--
-- Name: conversations Users can view their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: seller_activity Users can view their own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own activity" ON public.seller_activity FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_badges Users can view their own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own badges" ON public.notification_badges FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_browsing_history Users can view their own browsing history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own browsing history" ON public.user_browsing_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pwa_installs_log Users can view their own install logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own install logs" ON public.pwa_installs_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_task_progress Users can view their own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own progress" ON public.user_task_progress FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscription_requests Users can view their own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own requests" ON public.subscription_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_rewards Users can view their own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can view their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_manager_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_manager_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

--
-- Name: communities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

--
-- Name: community_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

--
-- Name: community_post_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: community_post_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: community_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: districts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: link_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.link_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: marketing_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketing_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: marketing_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

--
-- Name: product_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: product_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: product_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: provinces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: pwa_installs_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pwa_installs_log ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: reward_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reward_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: sectors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

--
-- Name: seller_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seller_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: shops; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: updates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

--
-- Name: user_browsing_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_browsing_history ENABLE ROW LEVEL SECURITY;

--
-- Name: user_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_task_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;