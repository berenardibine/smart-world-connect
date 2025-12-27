import { Link } from "react-router-dom";
import { Trophy, Target, Flame, ChevronRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const challenges = [
  {
    id: 1,
    title: "First Sale Champion",
    description: "Complete your first sale on Smart Market",
    reward: "50 Smart Coins",
    progress: 0,
    total: 1,
    icon: Trophy,
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    id: 2,
    title: "Social Butterfly",
    description: "Share 5 products with friends",
    reward: "25 Smart Coins",
    progress: 2,
    total: 5,
    icon: Target,
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    id: 3,
    title: "Daily Streak",
    description: "Visit Smart Market 7 days in a row",
    reward: "100 Smart Coins",
    progress: 3,
    total: 7,
    icon: Flame,
    color: "bg-orange-500/10 text-orange-500",
  },
];

export function SmartChallenges() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="section-header">Smart Challenges</h2>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            NEW
          </span>
        </div>
        <Link to="/rewards" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge) => {
          const Icon = challenge.icon;
          const progressPercent = (challenge.progress / challenge.total) * 100;
          
          return (
            <div
              key={challenge.id}
              className="glass-card-hover p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-2xl ${challenge.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {challenge.description}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{challenge.progress}/{challenge.total}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-sm">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">{challenge.reward}</span>
                </div>
                <Button size="sm" variant="ghost" className="rounded-xl text-xs h-8">
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
