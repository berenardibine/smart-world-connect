import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supaseClient";
import { toast } from "sonner";
import { 
  Trophy, Search, Calendar, Users, Coins, 
  Clock, CheckCircle2, Zap, Target, Gift
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward_points: number;
  reward_cash: number;
  deadline: string;
  status: string;
  participants_count: number;
  is_featured: boolean;
  created_at: string;
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChallenges();
    checkUser();
  }, [statusFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      fetchJoinedChallenges(session.user.id);
    }
  };

  const fetchJoinedChallenges = async (userId: string) => {
    const { data } = await supabase
      .from('challenge_submissions')
      .select('challenge_id')
      .eq('user_id', userId);
    
    if (data) {
      setJoinedChallenges(new Set(data.map(s => s.challenge_id)));
    }
  };

  const fetchChallenges = async () => {
    let query = supabase
      .from('innovation_challenges')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('deadline', { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching challenges:', error);
    } else {
      setChallenges(data || []);
    }
    setLoading(false);
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!currentUserId) {
      toast.error("Please sign in to join challenges");
      return;
    }

    if (joinedChallenges.has(challengeId)) {
      toast.info("You've already joined this challenge!");
      return;
    }

    const { error } = await supabase
      .from('challenge_submissions')
      .insert({
        challenge_id: challengeId,
        user_id: currentUserId,
        title: "My Submission",
        description: ""
      });

    if (error) {
      if (error.code === '23505') {
        toast.info("You've already joined this challenge!");
      } else {
        toast.error("Failed to join challenge");
        console.error(error);
      }
    } else {
      // Increment participants count
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) {
        await supabase
          .from('innovation_challenges')
          .update({ participants_count: challenge.participants_count + 1 })
          .eq('id', challengeId);
      }
      
      toast.success("You've joined the challenge! 🎯");
      setJoinedChallenges(prev => new Set(prev).add(challengeId));
      fetchChallenges();
    }
  };

  const getDaysRemaining = (deadline: string) => {
    if (!deadline) return null;
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return "Ended";
    if (days === 0) return "Ends today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const filteredChallenges = challenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-yellow-500 via-orange-500 to-primary py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="h-8 w-8 text-white animate-bounce" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Innovation Challenges</h1>
          </div>
          <p className="text-white/90 mb-4">
            Compete, innovate, and win rewards!
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {["all", "active", "upcoming", "completed"].map(status => (
              <Badge
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                className="cursor-pointer shrink-0 capitalize"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? "All Challenges" : status}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1,2,3,4].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No challenges found</h3>
            <p className="text-muted-foreground">
              Check back later for new innovation challenges!
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredChallenges.map(challenge => {
              const daysRemaining = getDaysRemaining(challenge.deadline);
              const isEnded = challenge.deadline && isPast(new Date(challenge.deadline));
              const hasJoined = joinedChallenges.has(challenge.id);
              
              return (
                <Card key={challenge.id} className={`p-5 hover:shadow-lg transition-all duration-300 group ${isEnded ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {challenge.is_featured && (
                        <Badge className="bg-yellow-500 text-white">
                          ⭐ Featured
                        </Badge>
                      )}
                      <Badge variant={isEnded ? "secondary" : "default"}>
                        {isEnded ? "Completed" : challenge.status}
                      </Badge>
                    </div>
                    {daysRemaining && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {daysRemaining}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    🏆 {challenge.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
                    {challenge.description}
                  </p>
                  
                  {/* Rewards */}
                  <div className="flex items-center gap-4 mt-4">
                    {challenge.reward_points > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{challenge.reward_points} pts</span>
                      </div>
                    )}
                    {challenge.reward_cash > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Gift className="h-4 w-4 text-green-500" />
                        <span className="font-medium">${challenge.reward_cash}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {challenge.participants_count} participants
                      </span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant={hasJoined ? "secondary" : "default"}
                      className="rounded-full"
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={isEnded}
                    >
                      {hasJoined ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Joined
                        </>
                      ) : isEnded ? (
                        "Ended"
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          Join
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {challenge.deadline && (
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Deadline: {format(new Date(challenge.deadline), 'MMM d, yyyy')}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
