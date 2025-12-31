-- Create videos table for short video reels
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  location_id UUID REFERENCES public.locations(id),
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for videos
CREATE POLICY "Anyone can view public videos" ON public.videos
FOR SELECT USING (is_public = true AND status = 'active');

CREATE POLICY "Users can insert their own videos" ON public.videos
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON public.videos
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON public.videos
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all videos" ON public.videos
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Video likes table
CREATE TABLE public.video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS on video_likes
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_likes
CREATE POLICY "Anyone can view video likes" ON public.video_likes
FOR SELECT USING (true);

CREATE POLICY "Users can add their own likes" ON public.video_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.video_likes
FOR DELETE USING (auth.uid() = user_id);

-- Video comments table
CREATE TABLE public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on video_comments
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_comments
CREATE POLICY "Anyone can view video comments" ON public.video_comments
FOR SELECT USING (true);

CREATE POLICY "Users can add comments" ON public.video_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.video_comments
FOR DELETE USING (auth.uid() = user_id);

-- Add posting_mode column to communities for admin-only posting
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS posting_mode TEXT DEFAULT 'all_members';

-- Community private replies table (for followers sending private messages to admins)
CREATE TABLE public.community_private_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on community_private_replies
ALTER TABLE public.community_private_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_private_replies
CREATE POLICY "Senders can view their own replies" ON public.community_private_replies
FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Community owners can view replies to their community" ON public.community_private_replies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = community_private_replies.community_id AND c.seller_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all private replies" ON public.community_private_replies
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can send private replies" ON public.community_private_replies
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own replies" ON public.community_private_replies
FOR DELETE USING (auth.uid() = sender_id);

-- Enable realtime for videos
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;