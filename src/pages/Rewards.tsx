import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Gift, Trophy, Coins, Target, Flame, Crown, 
  ChevronRight, Sparkles, Calendar, Star, Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Helmet } from "react-helmet";

const userStats = {
  coins: 250,
  points: 1500,
  streak: 5,
  rank: 42,
  level: 3,
  levelProgress: 65,
};

const dailyRewards = [
  { day: 1, reward: "10 Coins", claimed: true },
  { day: 2, reward: "15 Coins", claimed: true },
  { day: 3, reward: "20 Coins", claimed: true },
  { day: 4, reward: "25 Coins", claimed: true },
  { day: 5, reward: "30 Coins", claimed: true, isToday: true },
  { day: 6, reward: "40 Coins", claimed: false },
  { day: 7, reward: "🎁 Bonus Box", claimed: false, isSpecial: true },
];

const challenges = [
  {
    id: 1,
    title: "Share 5 Products",
    description: "Share products with friends and earn rewards",
    reward: "50 Coins",
    progress: 3,
    total: 5,
    icon: Target,
    color: "bg-blue-500/10 text-blue-500",
    expiresIn: "2 days",
  },
  {
    id: 2,
    title: "Daily Login Streak",
    description: "Visit Smart Market 7 days in a row",
    reward: "100 Coins + Badge",
    progress: 5,
    total: 7,
    icon: Flame,
    color: "bg-orange-500/10 text-orange-500",
    expiresIn: "Ongoing",
  },
  {
    id: 3,
    title: "First Purchase",
    description: "Complete your first purchase on Smart Market",
    reward: "75 Coins",
    progress: 0,
    total: 1,
    icon: Trophy,
    color: "bg-amber-500/10 text-amber-500",
    expiresIn: "7 days",
  },
];

const leaderboard = [
  { rank: 1, name: "John D.", coins: 5400, avatar: "JD" },
  { rank: 2, name: "Sarah K.", coins: 4800, avatar: "SK" },
  { rank: 3, name: "Mike R.", coins: 4200, avatar: "MR" },
  { rank: 4, name: "Emma L.", coins: 3900, avatar: "EL" },
  { rank: 5, name: "David M.", coins: 3500, avatar: "DM" },
];

export default function Rewards() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <>
      <Helmet>
        <title>Rewards - Smart Market</title>
        <meta name="description" content="Earn rewards on Smart Market. Complete challenges, collect coins, and win amazing prizes!" />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
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
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="h-5 w-5" />
                      <span className="text-sm opacity-80">Coins</span>
                    </div>
                    <p className="text-2xl font-bold">{userStats.coins}</p>
                  </div>
                  <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-5 w-5" />
                      <span className="text-sm opacity-80">Points</span>
                    </div>
                    <p className="text-2xl font-bold">{userStats.points}</p>
                  </div>
                  <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="h-5 w-5" />
                      <span className="text-sm opacity-80">Streak</span>
                    </div>
                    <p className="text-2xl font-bold">{userStats.streak} days</p>
                  </div>
                  <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="h-5 w-5" />
                      <span className="text-sm opacity-80">Rank</span>
                    </div>
                    <p className="text-2xl font-bold">#{userStats.rank}</p>
                  </div>
                </div>
                
                {/* Level Progress */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Level {userStats.level}</span>
                    <span>Level {userStats.level + 1}</span>
                  </div>
                  <Progress value={userStats.levelProgress} className="h-2 bg-primary-foreground/20" />
                  <p className="text-xs opacity-70">{userStats.levelProgress}% to next level</p>
                </div>
              </div>
            </div>

            {/* Daily Rewards */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Daily Rewards</h2>
                </div>
                <span className="text-sm text-muted-foreground">Day {userStats.streak}/7</span>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {dailyRewards.map((day) => (
                  <div
                    key={day.day}
                    className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all ${
                      day.claimed
                        ? "bg-primary/10 text-primary"
                        : day.isToday
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : "bg-muted text-muted-foreground"
                    } ${day.isSpecial ? "ring-2 ring-warning" : ""}`}
                  >
                    <span className="text-xs font-medium">Day {day.day}</span>
                    <span className="text-[10px] sm:text-xs mt-1 text-center">{day.reward}</span>
                    {day.claimed && !day.isToday && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-success text-success-foreground rounded-full text-[10px] flex items-center justify-center">✓</span>
                    )}
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-4 rounded-xl">
                Claim Today's Reward
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 p-1 rounded-2xl w-full">
                <TabsTrigger value="overview" className="flex-1 rounded-xl">Challenges</TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1 rounded-xl">Leaderboard</TabsTrigger>
                <TabsTrigger value="history" className="flex-1 rounded-xl">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-4">
                {challenges.map((challenge) => {
                  const Icon = challenge.icon;
                  const progressPercent = (challenge.progress / challenge.total) * 100;
                  
                  return (
                    <div key={challenge.id} className="glass-card-hover p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-2xl ${challenge.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{challenge.title}</h3>
                            <span className="text-xs text-muted-foreground">{challenge.expiresIn}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{challenge.description}</p>
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
                        <div className="flex items-center gap-1.5">
                          <Gift className="h-4 w-4 text-primary" />
                          <span className="font-medium text-primary">{challenge.reward}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="rounded-xl">
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-6">
                <div className="glass-card overflow-hidden">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user.rank}
                      className={`flex items-center gap-4 p-4 ${
                        index < leaderboard.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        user.rank === 1 ? "bg-amber-500 text-amber-950" :
                        user.rank === 2 ? "bg-slate-400 text-slate-950" :
                        user.rank === 3 ? "bg-orange-600 text-orange-50" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {user.rank}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Coins className="h-4 w-4" />
                        <span className="font-semibold">{user.coins}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your reward history will appear here</p>
                  <p className="text-sm mt-1">Complete challenges to earn rewards!</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
