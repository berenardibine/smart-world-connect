-- Recreate the view with explicit SECURITY INVOKER to satisfy linter
-- This ensures the view uses the querying user's permissions, not the creator's

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
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

-- Grant SELECT permission on the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

COMMENT ON VIEW public.public_profiles IS 'Public-safe profile data without sensitive information like email and phone numbers. Uses security_invoker for proper RLS enforcement.';