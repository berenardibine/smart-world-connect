CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'blocked'::text, 'banned'::text]))),
    CONSTRAINT profiles_user_type_check CHECK ((user_type = ANY (ARRAY['buyer'::text, 'seller'::text])))
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
-- Name: admin_messages admin_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_pkey PRIMARY KEY (id);


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
-- Name: idx_profiles_identity_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_identity_verified ON public.profiles USING btree (identity_verified);


--
-- Name: profiles enforce_safe_profile_updates; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_safe_profile_updates BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_update();


--
-- Name: messages update_conversation_on_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


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
-- Name: conversations conversations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


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
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seller_activity seller_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_activity
    ADD CONSTRAINT seller_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


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
-- Name: marketing_posts Admins can manage marketing posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage marketing posts" ON public.marketing_posts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: plans Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.plans USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_subscriptions Admins can manage subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


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
-- Name: subscription_requests Admins can update requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update requests" ON public.subscription_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_settings Admins can update site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seller_activity Admins can view all activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all activity" ON public.seller_activity FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_messages Admins can view all admin messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all admin messages" ON public.admin_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_requests Admins can view all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all requests" ON public.subscription_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_messages Admins can view contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_messages Anyone can submit contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: product_ratings Anyone can view ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view ratings" ON public.product_ratings FOR SELECT USING (true);


--
-- Name: conversations Buyers can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can create conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


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
-- Name: updates Sellers can create their own updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can create their own updates" ON public.updates FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: products Sellers can delete their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can delete their own products" ON public.products FOR DELETE USING ((auth.uid() = seller_id));


--
-- Name: updates Sellers can delete their own updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can delete their own updates" ON public.updates FOR DELETE USING ((auth.uid() = seller_id));


--
-- Name: products Sellers can insert their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can insert their own products" ON public.products FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: products Sellers can update their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update their own products" ON public.products FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: updates Sellers can update their own updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update their own updates" ON public.updates FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: seller_activity System can insert activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert activity" ON public.seller_activity FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: seller_activity System can update activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can update activity" ON public.seller_activity FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: updates Updates are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Updates are viewable by everyone" ON public.updates FOR SELECT USING (true);


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
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


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
-- Name: messages Users can update their messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their messages" ON public.messages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.buyer_id = auth.uid()) OR (conversations.seller_id = auth.uid()))))));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


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
-- Name: conversations Users can view their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: seller_activity Users can view their own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own activity" ON public.seller_activity FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscription_requests Users can view their own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own requests" ON public.subscription_requests FOR SELECT USING ((auth.uid() = user_id));


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
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: marketing_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

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
-- Name: seller_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seller_activity ENABLE ROW LEVEL SECURITY;

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
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


