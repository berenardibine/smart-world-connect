-- Add identity verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS id_front_photo TEXT,
ADD COLUMN IF NOT EXISTS id_back_photo TEXT,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create index for faster queries on verification status
CREATE INDEX IF NOT EXISTS idx_profiles_identity_verified ON public.profiles(identity_verified);

-- Add comment
COMMENT ON COLUMN public.profiles.id_front_photo IS 'URL to front of seller ID document';
COMMENT ON COLUMN public.profiles.id_back_photo IS 'URL to back of seller ID document';
COMMENT ON COLUMN public.profiles.identity_verified IS 'Whether seller identity has been verified by admin';
COMMENT ON COLUMN public.profiles.verification_notes IS 'Admin notes about identity verification';