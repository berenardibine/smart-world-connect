-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  logo_image TEXT,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community post likes table
CREATE TABLE public.community_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create community post comments table
CREATE TABLE public.community_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards/tasks table (admin managed)
CREATE TABLE public.reward_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 0,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  task_type TEXT NOT NULL CHECK (task_type IN ('daily', 'weekly', 'challenge', 'achievement')),
  requirement_count INTEGER DEFAULT 1,
  icon TEXT,
  color TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user task progress table
CREATE TABLE public.user_task_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.reward_tasks(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Create user rewards balance table
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  coins INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_login_date DATE,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning posts table (seller/admin created)
CREATE TABLE public.learning_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL,
  cover_image TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_free BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_posts ENABLE ROW LEVEL SECURITY;

-- Communities RLS Policies
CREATE POLICY "Anyone can view public communities" ON public.communities
  FOR SELECT USING (is_public = true);

CREATE POLICY "Community owners can manage their communities" ON public.communities
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all communities" ON public.communities
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Community Members RLS Policies
CREATE POLICY "Anyone can view community members" ON public.community_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Community owners can manage members" ON public.community_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.communities c 
      WHERE c.id = community_id AND c.seller_id = auth.uid()
    )
  );

-- Community Posts RLS Policies
CREATE POLICY "Anyone can view community posts" ON public.community_posts
  FOR SELECT USING (true);

CREATE POLICY "Members can create posts" ON public.community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_posts.community_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their posts" ON public.community_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their posts" ON public.community_posts
  FOR DELETE USING (auth.uid() = author_id);

-- Community Post Likes RLS Policies
CREATE POLICY "Anyone can view likes" ON public.community_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can add likes" ON public.community_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their likes" ON public.community_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Community Post Comments RLS Policies
CREATE POLICY "Anyone can view comments" ON public.community_post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can add comments" ON public.community_post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" ON public.community_post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Reward Tasks RLS Policies
CREATE POLICY "Anyone can view active reward tasks" ON public.reward_tasks
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage reward tasks" ON public.reward_tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- User Task Progress RLS Policies
CREATE POLICY "Users can view their own progress" ON public.user_task_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_task_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress" ON public.user_task_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- User Rewards RLS Policies
CREATE POLICY "Users can view their own rewards" ON public.user_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" ON public.user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards" ON public.user_rewards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rewards" ON public.user_rewards
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Learning Posts RLS Policies
CREATE POLICY "Anyone can view published learning posts" ON public.learning_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authors can manage their learning posts" ON public.learning_posts
  FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all learning posts" ON public.learning_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updating member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_member_count_trigger
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();