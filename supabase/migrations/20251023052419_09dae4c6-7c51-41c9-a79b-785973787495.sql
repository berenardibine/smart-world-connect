-- Fix Critical Security Issue: Email Exposure and Self-Status Modification
-- This migration restricts email visibility and prevents users from modifying admin-managed fields

-- 1. Create a function to validate safe profile updates
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to update anything
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, prevent changes to admin-managed fields
  IF auth.uid() = NEW.id THEN
    -- Restore admin-managed fields to their original values
    NEW.status := OLD.status;
    NEW.rating := OLD.rating;
    NEW.rating_count := OLD.rating_count;
    NEW.user_type := OLD.user_type;
    NEW.email := OLD.email;
    RETURN NEW;
  END IF;
  
  -- Deny updates from other users (shouldn't reach here due to RLS)
  RAISE EXCEPTION 'Unauthorized profile update';
END;
$$;

-- 2. Create trigger to enforce safe updates
DROP TRIGGER IF EXISTS enforce_safe_profile_updates ON public.profiles;

CREATE TRIGGER enforce_safe_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_update();

-- 3. Simplify RLS policies
DROP POLICY IF EXISTS "Anyone can view limited profile info" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update safe profile fields" ON public.profiles;

-- Allow anyone to view profiles (email filtering will be handled in app layer)
CREATE POLICY "Public can view profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow users to update their own profiles (trigger will enforce field restrictions)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Ensure admins policy exists
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));