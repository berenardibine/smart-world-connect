-- Add title field to updates table
ALTER TABLE public.updates
ADD COLUMN title text;

-- Add impressions field to products table for click tracking
ALTER TABLE public.products
ADD COLUMN impressions integer DEFAULT 0;