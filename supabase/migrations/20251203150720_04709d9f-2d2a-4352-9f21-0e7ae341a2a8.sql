-- Create marketing_posts table for admin marketing content
CREATE TABLE public.marketing_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}'::TEXT[],
  video_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Learn More',
  post_type TEXT NOT NULL DEFAULT 'announcement',
  is_active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view active marketing posts
CREATE POLICY "Everyone can view active marketing posts"
ON public.marketing_posts
FOR SELECT
USING (is_active = true);

-- Only admins can manage marketing posts
CREATE POLICY "Admins can manage marketing posts"
ON public.marketing_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update opportunities table - only admin can insert/update/delete
-- First drop existing seller policies
DROP POLICY IF EXISTS "Sellers can insert their own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Sellers can update their own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Sellers can delete their own opportunities" ON public.opportunities;

-- Create admin-only policies for opportunities
CREATE POLICY "Only admins can insert opportunities"
ON public.opportunities
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update opportunities"
ON public.opportunities
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete opportunities"
ON public.opportunities
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));