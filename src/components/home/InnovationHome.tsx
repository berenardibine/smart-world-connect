import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supaseClient";
import { 
  Lightbulb, Cog, Trophy, TrendingUp, Sparkles, 
  ArrowRight, Star, Users, Zap, BookOpen
} from "lucide-react";

interface FeaturedIdea {
  id: string;
  title: string;
  category: string;
  likes_count: number;
  profile?: { full_name: string };
}

interface FeaturedProject {
  id: string;
  title: string;
  status: string;
  members: string[];
  progress: number;
}

interface FeaturedChallenge {
  id: string;
  title: string;
  reward_points: number;
  participants_count: number;
  deadline: string;
}

interface DailyMotivation {
  quote: string;
  author: string;
}

export function InnovationHome() {
  const [featuredIdeas, setFeaturedIdeas] = useState<FeaturedIdea[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [featuredChallenges, setFeaturedChallenges] = useState<FeaturedChallenge[]>([]);
  const [dailyMotivation, setDailyMotivation] = useState<DailyMotivation | null>(null);
  const [ideaOfTheDay, setIdeaOfTheDay] = useState<FeaturedIdea | null>(null);

  useEffect(() => {
    fetchFeaturedContent();
    fetchDailyMotivation();
  }, []);

  const fetchFeaturedContent = async () => {
    // Fetch featured ideas
    const { data: ideas } = await supabase
      .from('innovation_ideas')
      .select('id, title, category, likes_count, profile:profiles!innovation_ideas_user_id_fkey(full_name)')
      .eq('status', 'published')
      .order('likes_count', { ascending: false })
      .limit(3);
    
    if (ideas) {
      setFeaturedIdeas(ideas);
      if (ideas.length > 0) {
        // Random idea of the day
        const randomIdx = Math.floor(Math.random() * ideas.length);
        setIdeaOfTheDay(ideas[randomIdx]);
      }
    }

    // Fetch featured projects
    const { data: projects } = await supabase
      .from('innovation_projects')
      .select('id, title, status, members, progress')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (projects) setFeaturedProjects(projects);

    // Fetch active challenges
    const { data: challenges } = await supabase
      .from('innovation_challenges')
      .select('id, title, reward_points, participants_count, deadline')
      .eq('status', 'active')
      .order('deadline', { ascending: true })
      .limit(3);
    
    if (challenges) setFeaturedChallenges(challenges);
  };

  const fetchDailyMotivation = async () => {
    const { data } = await supabase
      .from('daily_motivations')
      .select('quote, author')
      .order('display_date', { ascending: false })
      .limit(1)
      .single();
    
    if (data) setDailyMotivation(data);
  };

  return (
    <div className="space-y-6">
      {/* Daily Motivation Section */}
      {dailyMotivation && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-orange-500 to-pink-500 text-white p-6 rounded-2xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium opacity-90">Daily Innovation Quote</span>
            </div>
            <p className="text-lg font-medium leading-relaxed mb-3">
              "{dailyMotivation.quote}"
            </p>
            <p className="text-sm opacity-80">— {dailyMotivation.author}</p>
          </div>
          {/* Floating emojis */}
          <span className="absolute top-4 right-4 text-2xl animate-float opacity-50">💡</span>
          <span className="absolute bottom-4 right-12 text-xl animate-float opacity-50" style={{ animationDelay: '1s' }}>✨</span>
        </Card>
      )}

      {/* Featured Innovations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Trending Ideas</h2>
          </div>
          <Link to="/ideas">
            <Button variant="ghost" size="sm" className="gap-1">
              See All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-3">
          {featuredIdeas.map(idea => (
            <Link key={idea.id} to="/ideas">
              <Card className="p-4 hover:shadow-md transition-all group">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                      {idea.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{idea.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ❤️ {idea.likes_count} likes
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {featuredIdeas.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No ideas yet. Be the first!</p>
            </Card>
          )}
        </div>
      </section>

      {/* Featured Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cog className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Active Projects</h2>
          </div>
          <Link to="/projects">
            <Button variant="ghost" size="sm" className="gap-1">
              See All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-3">
          {featuredProjects.map(project => (
            <Link key={project.id} to="/projects">
              <Card className="p-4 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0">
                      <Cog className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {project.members?.length || 1} members
                        <span>•</span>
                        <span className="capitalize">{project.status}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{project.progress}%</Badge>
                </div>
              </Card>
            </Link>
          ))}
          {featuredProjects.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              <Cog className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No projects yet. Start one!</p>
            </Card>
          )}
        </div>
      </section>

      {/* Challenge Highlights */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="font-semibold text-lg">Active Challenges</h2>
          </div>
          <Link to="/challenges">
            <Button variant="ghost" size="sm" className="gap-1">
              See All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-3">
          {featuredChallenges.map(challenge => (
            <Link key={challenge.id} to="/challenges">
              <Card className="p-4 hover:shadow-md transition-all group bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {challenge.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        {challenge.reward_points} pts
                        <span>•</span>
                        <Users className="h-3 w-3" />
                        {challenge.participants_count} joined
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="rounded-full">
                    Join
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
          {featuredChallenges.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active challenges. Check back soon!</p>
            </Card>
          )}
        </div>
      </section>

      {/* Idea of the Day */}
      {ideaOfTheDay && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="font-semibold text-lg">Idea of the Day</h2>
          </div>
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-orange-500/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shrink-0">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{ideaOfTheDay.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{ideaOfTheDay.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    by {ideaOfTheDay.profile?.full_name || 'Anonymous'}
                  </span>
                </div>
                <Link to="/ideas">
                  <Button size="sm" className="mt-3 rounded-full">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Read More
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
