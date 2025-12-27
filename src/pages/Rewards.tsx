import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Gift, Trophy, Coins, Target, Flame, Crown, 
  ChevronRight, Sparkles, Calendar, Star, Zap, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Helmet } from "react-helmet";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";

interface RewardTask {
  id: string;
  title: string;
  description: string;
  reward_points: number;
  reward_coins: number;
  task_type: string;
  requirement_count: number;
  icon: string | null;
  color: string | null;
  expires_at: string | null;
}

interface UserRewards {
  coins: number;
  points: number;
  streak_days: number;
  level: number;
}

interface UserProgress {
  task_id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  target: Target,
  flame: Flame,
  star: Star,
  gift: Gift,
  zap: Zap,
};

export default function Rewards() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("challenges");
  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [userRewards, setUserRewards] = useState<UserRewards | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      await Promise.all([
        loadTasks(),
        loadUserRewards(session.user.id),
        loadUserProgress(session.user.id),
      ]);
    } else {
      await loadTasks();
    }
    setLoading(false);
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("reward_tasks")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error && data) setTasks(data);
  };

  const loadUserRewards = async (uid: string) => {
    const { data } = await supabase
      .from("user_rewards")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (data) {
      setUserRewards(data);
    } else {
      // Create initial rewards record
      const { data: newRewards } = await supabase
        .from("user_rewards")
        .insert({ user_id: uid })
        .select()
        .single();
      if (newRewards) setUserRewards(newRewards);
    }
  };

  const loadUserProgress = async (uid: string) => {
    const { data } = await supabase
      .from("user_task_progress")
      .select("*")
      .eq("user_id", uid);

    if (data) {
      const progressMap: Record<string, UserProgress> = {};
      data.forEach(p => {
        progressMap[p.task_id] = p;
      });
      setUserProgress(progressMap);
    }
  };

  const calculateLevelProgress = () => {
    if (!userRewards) return 0;
    const pointsPerLevel = 500;
    return ((userRewards.points % pointsPerLevel) / pointsPerLevel) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Rewards - Smart Market</title>
        <meta name="description" content="Earn rewards on Smart Market. Complete challenges, collect coins, and win amazing prizes!" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 pb-24">
        <Navbar />

        <main className="pt-[120px] md:pt-20">
          <div className="container mx-auto px-4 lg:px-6 space-y-6">
            {/* Header with Stats */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-primary p-6 sm:p-8 text-primary-foreground">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/5 rounded-full blur-2xl" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <Gift className="h-7 w-7" />
                  <h1 className="text-2xl sm:text-3xl font-bold">Smart Rewards</h1>
                </div>
                
                {userId ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🪙</span>
                          <span className="text-sm opacity-80">Coins</span>
                        </div>
                        <p className="text-2xl font-bold">{userRewards?.coins || 0}</p>
                      </div>
                      <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-5 w-5" />
                          <span className="text-sm opacity-80">Points</span>
                        </div>
                        <p className="text-2xl font-bold">{userRewards?.points || 0}</p>
                      </div>
                      <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Flame className="h-5 w-5" />
                          <span className="text-sm opacity-80">Streak</span>
                        </div>
                        <p className="text-2xl font-bold">{userRewards?.streak_days || 0} days</p>
                      </div>
                      <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Crown className="h-5 w-5" />
                          <span className="text-sm opacity-80">Level</span>
                        </div>
                        <p className="text-2xl font-bold">{userRewards?.level || 1}</p>
                      </div>
                    </div>
                    
                    {/* Level Progress */}
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Level {userRewards?.level || 1}</span>
                        <span>Level {(userRewards?.level || 1) + 1}</span>
                      </div>
                      <Progress value={calculateLevelProgress()} className="h-2 bg-primary-foreground/20" />
                      <p className="text-xs opacity-70">{Math.round(calculateLevelProgress())}% to next level</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="mb-4 opacity-80">Sign in to track your rewards and complete challenges!</p>
                    <Link to="/auth">
                      <Button variant="secondary" className="rounded-xl">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 p-1 rounded-2xl w-full">
                <TabsTrigger value="challenges" className="flex-1 rounded-xl gap-2">
                  <Target className="h-4 w-4" />
                  Challenges
                </TabsTrigger>
                <TabsTrigger value="daily" className="flex-1 rounded-xl gap-2">
                  <Calendar className="h-4 w-4" />
                  Daily
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex-1 rounded-xl gap-2">
                  <Trophy className="h-4 w-4" />
                  Achievements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="challenges" className="mt-6 space-y-4">
                {tasks.filter(t => t.task_type === 'challenge' || t.task_type === 'weekly').length === 0 ? (
                  <div className="text-center py-12 glass-card">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No challenges available yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Check back soon for exciting challenges!</p>
                  </div>
                ) : (
                  tasks.filter(t => t.task_type === 'challenge' || t.task_type === 'weekly').map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      progress={userProgress[task.id]}
                      userId={userId}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="daily" className="mt-6 space-y-4">
                {tasks.filter(t => t.task_type === 'daily').length === 0 ? (
                  <div className="text-center py-12 glass-card">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No daily tasks available</p>
                  </div>
                ) : (
                  tasks.filter(t => t.task_type === 'daily').map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      progress={userProgress[task.id]}
                      userId={userId}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="achievements" className="mt-6 space-y-4">
                {tasks.filter(t => t.task_type === 'achievement').length === 0 ? (
                  <div className="text-center py-12 glass-card">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No achievements yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Complete challenges to unlock achievements!</p>
                  </div>
                ) : (
                  tasks.filter(t => t.task_type === 'achievement').map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      progress={userProgress[task.id]}
                      userId={userId}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}

function TaskCard({ 
  task, 
  progress,
  userId 
}: { 
  task: RewardTask; 
  progress?: UserProgress;
  userId: string | null;
}) {
  const Icon = iconMap[task.icon || 'target'] || Target;
  const colorClass = task.color 
    ? `bg-${task.color}-500/10 text-${task.color}-500 border-${task.color}-500/20`
    : "bg-primary/10 text-primary border-primary/20";
  
  const currentProgress = progress?.progress || 0;
  const progressPercent = (currentProgress / task.requirement_count) * 100;
  const isCompleted = progress?.completed || false;
  const isClaimed = progress?.claimed || false;

  return (
    <div className={`glass-card-hover p-5 space-y-4 ${isCompleted ? 'border-success/30' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-2xl border ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{task.title}</h3>
            {task.expires_at && (
              <span className="text-xs text-muted-foreground">
                Expires {new Date(task.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{currentProgress}/{task.requirement_count}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {task.reward_coins > 0 && (
            <div className="flex items-center gap-1 text-sm bg-warning/10 px-2.5 py-1 rounded-lg">
              <span>🪙</span>
              <span className="font-medium text-warning">{task.reward_coins}</span>
            </div>
          )}
          {task.reward_points > 0 && (
            <div className="flex items-center gap-1 text-sm bg-primary/10 px-2.5 py-1 rounded-lg">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-primary">{task.reward_points}</span>
            </div>
          )}
        </div>
        
        {isClaimed ? (
          <span className="text-sm text-success font-medium flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> Claimed
          </span>
        ) : isCompleted ? (
          <Button size="sm" className="rounded-xl">
            Claim Reward
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="rounded-xl">
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}