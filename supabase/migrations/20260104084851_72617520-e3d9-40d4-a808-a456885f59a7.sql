
-- Add foreign key relationships to profiles for the new tables
ALTER TABLE public.innovation_ideas 
ADD CONSTRAINT innovation_ideas_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.innovation_projects 
ADD CONSTRAINT innovation_projects_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.innovation_challenges 
ADD CONSTRAINT innovation_challenges_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.idea_library 
ADD CONSTRAINT idea_library_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
