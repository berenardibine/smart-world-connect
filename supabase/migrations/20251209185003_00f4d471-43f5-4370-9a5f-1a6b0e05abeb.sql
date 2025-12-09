-- Create table for tracking user browsing history
CREATE TABLE public.user_browsing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_product_view UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.user_browsing_history ENABLE ROW LEVEL SECURITY;

-- Users can view and insert their own browsing history
CREATE POLICY "Users can view their own browsing history"
ON public.user_browsing_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own browsing history"
ON public.user_browsing_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own browsing history"
ON public.user_browsing_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_browsing_history_user ON public.user_browsing_history(user_id);
CREATE INDEX idx_browsing_history_product ON public.user_browsing_history(product_id);
CREATE INDEX idx_browsing_history_viewed_at ON public.user_browsing_history(viewed_at DESC);