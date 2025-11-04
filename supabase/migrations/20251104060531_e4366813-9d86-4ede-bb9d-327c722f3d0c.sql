-- Create opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT NOT NULL,
  salary TEXT,
  job_type TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  contact_email TEXT,
  apply_link TEXT,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  status TEXT DEFAULT 'pending',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies for opportunities
CREATE POLICY "Opportunities are viewable by everyone"
ON public.opportunities
FOR SELECT
USING (true);

CREATE POLICY "Sellers can insert their own opportunities"
ON public.opportunities
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own opportunities"
ON public.opportunities
FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own opportunities"
ON public.opportunities
FOR DELETE
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can update any opportunity"
ON public.opportunities
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any opportunity"
ON public.opportunities
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment opportunity views
CREATE OR REPLACE FUNCTION public.increment_opportunity_view(opportunity_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.opportunities
  SET views = COALESCE(views, 0) + 1
  WHERE id = opportunity_uuid;
END;
$function$;