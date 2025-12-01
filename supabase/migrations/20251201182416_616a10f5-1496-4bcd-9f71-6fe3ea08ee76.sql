-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  price_rwf integer NOT NULL,
  post_limit_monthly integer NOT NULL, -- -1 for unlimited
  updates_limit_monthly integer NOT NULL, -- -1 for unlimited
  can_edit_product boolean NOT NULL DEFAULT false,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create subscription_requests table
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  amount_rwf integer NOT NULL,
  payment_reference text,
  phone_paid_to text,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  admin_note text
);

-- Create seller_activity table
CREATE TABLE IF NOT EXISTS public.seller_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  posts_this_month integer NOT NULL DEFAULT 0,
  updates_this_month integer NOT NULL DEFAULT 0,
  edits_this_month integer NOT NULL DEFAULT 0,
  last_reset_date timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_activity ENABLE ROW LEVEL SECURITY;

-- Plans policies
CREATE POLICY "Everyone can view active plans"
  ON public.plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User subscriptions policies
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Subscription requests policies
CREATE POLICY "Users can create their own requests"
  ON public.subscription_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
  ON public.subscription_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.subscription_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update requests"
  ON public.subscription_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seller activity policies
CREATE POLICY "Users can view their own activity"
  ON public.seller_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity"
  ON public.seller_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update activity"
  ON public.seller_activity FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.seller_activity FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default plans
INSERT INTO public.plans (key, name, price_rwf, post_limit_monthly, updates_limit_monthly, can_edit_product, description) VALUES
  ('free', 'Free', 0, 1, 0, false, 'Post 1 product/opportunity monthly. Can''t create updates or edit products.'),
  ('stone', 'Stone', 1000, 5, 2, true, 'Post 5 items monthly, 2 updates monthly, can edit products.'),
  ('gold', 'Gold', 5000, 10, 10, true, 'Post 10 items monthly, 10 updates monthly, can edit products.'),
  ('silver', 'Silver', 25000, 50, -1, true, 'Post 50 items monthly, unlimited updates.'),
  ('diamond', 'Diamond', 50000, 70, -1, true, 'Post 70 items monthly, unlimited updates and priority.'),
  ('master', 'Master', 100000, -1, -1, true, 'Unlimited posts and updates. Full access.')
ON CONFLICT (key) DO NOTHING;

-- Function to reset monthly activity
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

-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION public.can_user_perform_action(
  _user_id uuid,
  _action_type text -- 'post', 'update', or 'edit'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Function to record user action
CREATE OR REPLACE FUNCTION public.record_user_action(
  _user_id uuid,
  _action_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_plans_timestamp
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_user_subscriptions_timestamp
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_seller_activity_timestamp
  BEFORE UPDATE ON public.seller_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();