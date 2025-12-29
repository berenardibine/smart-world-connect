-- Add is_pinned_by_admin column to communities table
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_pinned_by_admin boolean DEFAULT false;

-- Add allow_member_messaging column to communities table  
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS allow_member_messaging boolean DEFAULT true;

-- Create community messages table for group messaging
CREATE TABLE IF NOT EXISTS public.community_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- Enable RLS on community_messages
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view messages in communities they are members of
CREATE POLICY "Members can view community messages"
ON public.community_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_messages.community_id
    AND cm.user_id = auth.uid()
  )
);

-- Policy: Members can send messages if community allows it
CREATE POLICY "Members can send messages if allowed"
ON public.community_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM community_members cm
    JOIN communities c ON c.id = cm.community_id
    WHERE cm.community_id = community_messages.community_id
    AND cm.user_id = auth.uid()
    AND c.allow_member_messaging = true
  )
);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.community_messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- Enable realtime for community messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_community_messages_community ON public.community_messages(community_id, created_at DESC);