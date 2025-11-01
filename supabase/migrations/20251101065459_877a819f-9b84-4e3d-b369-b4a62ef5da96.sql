-- Add delivered_at to messages for delivery tracking
ALTER TABLE public.messages ADD COLUMN delivered_at timestamp with time zone;

-- Create updates table for seller posts
CREATE TABLE public.updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  images text[] DEFAULT '{}',
  video_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on updates
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Everyone can view updates
CREATE POLICY "Updates are viewable by everyone"
ON public.updates FOR SELECT
USING (true);

-- Sellers can create their own updates
CREATE POLICY "Sellers can create their own updates"
ON public.updates FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own updates
CREATE POLICY "Sellers can update their own updates"
ON public.updates FOR UPDATE
USING (auth.uid() = seller_id);

-- Sellers can delete their own updates
CREATE POLICY "Sellers can delete their own updates"
ON public.updates FOR DELETE
USING (auth.uid() = seller_id);

-- Add trigger for updates timestamp
CREATE TRIGGER update_updates_updated_at
BEFORE UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for conversations and updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.updates;