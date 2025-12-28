-- Add more columns for enhanced community features
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS rules TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS posting_permission TEXT DEFAULT 'all_members',
ADD COLUMN IF NOT EXISTS join_approval_required BOOLEAN DEFAULT false;

-- Add pinned field to community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Add evidence/proof field to user_task_progress for admin approval
ALTER TABLE public.user_task_progress
ADD COLUMN IF NOT EXISTS evidence_url TEXT,
ADD COLUMN IF NOT EXISTS evidence_text TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Update reward_tasks with more fields
ALTER TABLE public.reward_tasks
ADD COLUMN IF NOT EXISTS requires_evidence BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create notification badges table for unread counts
CREATE TABLE IF NOT EXISTS public.notification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

ALTER TABLE public.notification_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own badges" ON public.notification_badges;
CREATE POLICY "Users can view their own badges"
ON public.notification_badges FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own badges" ON public.notification_badges;
CREATE POLICY "Users can update their own badges"
ON public.notification_badges FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert badges" ON public.notification_badges;
CREATE POLICY "System can insert badges"
ON public.notification_badges FOR INSERT
WITH CHECK (true);

-- Add level badge column to user_rewards
ALTER TABLE public.user_rewards
ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'Bronze';