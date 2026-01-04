
-- Innovation Ideas Table
CREATE TABLE public.innovation_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  files TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Innovation Projects Table
CREATE TABLE public.innovation_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objective TEXT,
  creator_id UUID NOT NULL,
  members UUID[] DEFAULT '{}',
  files TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'ideation',
  progress INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Institutions Table
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  country TEXT,
  description TEXT,
  focus_areas TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  contact_email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Innovation Challenges Table
CREATE TABLE public.innovation_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_points INTEGER DEFAULT 0,
  reward_cash NUMERIC DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  participants_count INTEGER DEFAULT 0,
  created_by UUID,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Smart Wallet Table
CREATE TABLE public.smart_wallet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wallet Transactions Table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES smart_wallet(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Idea Library Table
CREATE TABLE public.idea_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  category TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Idea Comments Table
CREATE TABLE public.idea_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES innovation_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Idea Likes Table
CREATE TABLE public.idea_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES innovation_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

-- Challenge Submissions Table
CREATE TABLE public.challenge_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES innovation_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  files TEXT[] DEFAULT '{}',
  score INTEGER,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project Messages Table (Team Chat)
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES innovation_projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily Motivation Quotes
CREATE TABLE public.daily_motivations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote TEXT NOT NULL,
  author TEXT,
  category TEXT DEFAULT 'innovation',
  display_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.innovation_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovation_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_motivations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for innovation_ideas
CREATE POLICY "Anyone can view ideas" ON public.innovation_ideas FOR SELECT USING (true);
CREATE POLICY "Users can create ideas" ON public.innovation_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON public.innovation_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON public.innovation_ideas FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage ideas" ON public.innovation_ideas FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for innovation_projects
CREATE POLICY "Anyone can view projects" ON public.innovation_projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON public.innovation_projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update projects" ON public.innovation_projects FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = ANY(members));
CREATE POLICY "Creators can delete projects" ON public.innovation_projects FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for institutions
CREATE POLICY "Anyone can view institutions" ON public.institutions FOR SELECT USING (true);
CREATE POLICY "Admins can manage institutions" ON public.institutions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for innovation_challenges
CREATE POLICY "Anyone can view challenges" ON public.innovation_challenges FOR SELECT USING (true);
CREATE POLICY "Admins can manage challenges" ON public.innovation_challenges FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for smart_wallet
CREATE POLICY "Users can view own wallet" ON public.smart_wallet FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wallet" ON public.smart_wallet FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update wallets" ON public.smart_wallet FOR UPDATE USING (true);

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM smart_wallet WHERE smart_wallet.id = wallet_transactions.wallet_id AND smart_wallet.user_id = auth.uid()));
CREATE POLICY "System can insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

-- RLS Policies for idea_library
CREATE POLICY "Anyone can view library" ON public.idea_library FOR SELECT USING (true);
CREATE POLICY "Users can upload to library" ON public.idea_library FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Admins can manage library" ON public.idea_library FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for idea_comments
CREATE POLICY "Anyone can view comments" ON public.idea_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.idea_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.idea_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for idea_likes
CREATE POLICY "Anyone can view likes" ON public.idea_likes FOR SELECT USING (true);
CREATE POLICY "Users can add likes" ON public.idea_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove likes" ON public.idea_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for challenge_submissions
CREATE POLICY "Anyone can view submissions" ON public.challenge_submissions FOR SELECT USING (true);
CREATE POLICY "Users can submit" ON public.challenge_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON public.challenge_submissions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for project_messages
CREATE POLICY "Project members can view messages" ON public.project_messages FOR SELECT USING (EXISTS (SELECT 1 FROM innovation_projects WHERE innovation_projects.id = project_messages.project_id AND (innovation_projects.creator_id = auth.uid() OR auth.uid() = ANY(innovation_projects.members))));
CREATE POLICY "Project members can send messages" ON public.project_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for daily_motivations
CREATE POLICY "Anyone can view motivations" ON public.daily_motivations FOR SELECT USING (true);
CREATE POLICY "Admins can manage motivations" ON public.daily_motivations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.innovation_ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.innovation_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- Insert some default motivational quotes
INSERT INTO public.daily_motivations (quote, author, category, display_date) VALUES
('Innovation distinguishes between a leader and a follower.', 'Steve Jobs', 'innovation', CURRENT_DATE),
('The best way to predict the future is to create it.', 'Peter Drucker', 'innovation', CURRENT_DATE + 1),
('Ideas are the beginning points of all fortunes.', 'Napoleon Hill', 'innovation', CURRENT_DATE + 2),
('Creativity is intelligence having fun.', 'Albert Einstein', 'creativity', CURRENT_DATE + 3),
('The only way to do great work is to love what you do.', 'Steve Jobs', 'innovation', CURRENT_DATE + 4);
