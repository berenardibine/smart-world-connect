-- Add WhatsApp number and call number columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN whatsapp_number text,
ADD COLUMN call_number text;