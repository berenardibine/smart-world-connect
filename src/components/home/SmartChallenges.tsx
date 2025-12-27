import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Target, Flame, ChevronRight, Gift, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supaseClient";

interface RewardTask {
  id: string;
  title: string;
  description: string;
  reward_points: number;
  reward_coins: number;
  task_type: string;
  requirement_count: number;
  icon: string;
  color: string;
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  target: Target,
  flame: Flame,
  star: Star,
  gift: Gift,
};

const colorMap: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  green: "bg-green-500/10 text-green-500 border-green-500/20",
};

export function SmartChallenges() {
  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("reward_tasks")
        .select("*")
        .eq("is_active", true)
        .limit(3);

      if (error) throw error;
      setTasks(data || []);

      // Load user progress if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: progressData } = await supabase
          .from("user_task_progress")
          .select("task_id, progress")
          .eq("user_id", session.user.id);

        if (progressData) {
          const progressMap: Record<string, number> = {};
          progressData.forEach(p => {
            progressMap[p.task_id] = p.progress;
          });
          setUserProgress(progressMap);
        }
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="section-header">Smart Challenges</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              🎮 GAMIFY
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="section-header">Smart Challenges</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              🎮 GAMIFY
            </span>
          </div>
          <Link to="/rewards" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Challenges Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Check back soon for exciting challenges and rewards!
          </p>
          <Link to="/rewards">
            <Button variant="outline" className="rounded-xl">
              Explore Rewards
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-warning" />
          <h2 className="section-header">Smart Challenges</h2>
          <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-semibold animate-pulse">
            🎮 EARN
          </span>
        </div>
        <Link to="/rewards" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const Icon = iconMap[task.icon] || Trophy;
          const colorClass = colorMap[task.color] || colorMap.amber;
          const progress = userProgress[task.id] || 0;
          const progressPercent = (progress / task.requirement_count) * 100;
          
          return (
            <div
              key={task.id}
              className="glass-card-hover p-5 space-y-4 relative overflow-hidden group"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start gap-3 relative">
                <div className={`p-3 rounded-2xl border ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {task.description}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{progress}/{task.requirement_count}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  {task.reward_coins > 0 && (
                    <div className="flex items-center gap-1 text-sm bg-warning/10 px-2 py-1 rounded-lg">
                      <span className="text-warning">🪙</span>
                      <span className="font-medium text-warning">{task.reward_coins}</span>
                    </div>
                  )}
                  {task.reward_points > 0 && (
                    <div className="flex items-center gap-1 text-sm bg-primary/10 px-2 py-1 rounded-lg">
                      <Star className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium text-primary">{task.reward_points}</span>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="rounded-xl text-xs h-8 hover:bg-primary/10 hover:text-primary">
                  Start →
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}