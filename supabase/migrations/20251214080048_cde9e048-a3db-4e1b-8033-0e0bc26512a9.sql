-- Add new columns to products table for negotiable pricing, rental rates, and admin contact info
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_negotiable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rental_rate_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contact_whatsapp text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contact_call text DEFAULT NULL;

-- Add comment to explain rental_rate_type values
COMMENT ON COLUMN public.products.rental_rate_type IS 'For equipment rental: per_day, per_week, per_month, per_hour, custom';
COMMENT ON COLUMN public.products.is_negotiable IS 'Whether the price is negotiable';
COMMENT ON COLUMN public.products.contact_whatsapp IS 'Manual WhatsApp number for admin-posted products';
COMMENT ON COLUMN public.products.contact_call IS 'Manual call number for admin-posted products';