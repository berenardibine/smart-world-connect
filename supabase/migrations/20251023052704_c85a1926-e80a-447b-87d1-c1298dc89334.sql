-- Create a secure public profile view that excludes sensitive information
-- This prevents accidental email/phone exposure in application queries

CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Grant SELECT permission on the view to authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO authenticated, anon;

COMMENT ON VIEW public.public_profiles IS 'Public-safe profile data without sensitive information like email and phone numbers';