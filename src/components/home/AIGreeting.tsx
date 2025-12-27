import { useState, useEffect } from "react";
import { Sun, Moon, CloudSun, Sparkles, Rocket, Gift, Crown } from "lucide-react";
import { supabase } from "@/lib/supaseClient";
import { Link } from "react-router-dom";

export function AIGreeting() {
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [emoji, setEmoji] = useState<React.ReactNode>(<Sun className="h-7 w-7" />);
  const [bgClass, setBgClass] = useState("from-primary/20 via-primary/5 to-warning/10");

  useEffect(() => {
    loadUserName();
    updateGreeting();
  }, []);

  const loadUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .maybeSingle();
      
      if (profile?.full_name) {
        setUserName(profile.full_name.split(" ")[0]);
      }
    }
  };

  const updateGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
      setEmoji(<Sun className="h-7 w-7 text-warning" />);
      setBgClass("from-warning/20 via-primary/10 to-warning/5");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
      setEmoji(<CloudSun className="h-7 w-7 text-primary" />);
      setBgClass("from-primary/20 via-info/10 to-primary/5");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
      setEmoji(<CloudSun className="h-7 w-7 text-primary" />);
      setBgClass("from-primary/20 via-destructive/5 to-primary/10");
    } else {
      setGreeting("Good Night");
      setEmoji(<Moon className="h-7 w-7 text-info" />);
      setBgClass("from-info/20 via-primary/5 to-info/10");
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${bgClass} border border-primary/20 p-6 sm:p-8`}>
      {/* Animated decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-warning/10 rounded-full blur-2xl" />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-info/10 rounded-full blur-xl animate-float" />
      
      <div className="relative">
        <div className="flex items-start sm:items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-sm shadow-lg">
            {emoji}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {greeting}{userName ? `, ${userName}` : ""}! 
              <span className="inline-block ml-2 animate-bounce">👋</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-1">
              Discover amazing deals and connect with local sellers today.
            </p>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Link 
            to="/rewards" 
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/20 hover:border-warning/40 transition-all group"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-xl bg-warning/20 group-hover:scale-110 transition-transform">
                <Gift className="h-5 w-5 text-warning" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground">Rewards</span>
            </div>
          </Link>
          
          <Link 
            to="/community" 
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-info/20 to-info/5 border border-info/20 hover:border-info/40 transition-all group"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-xl bg-info/20 group-hover:scale-110 transition-transform">
                <Crown className="h-5 w-5 text-info" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground">Community</span>
            </div>
          </Link>
          
          <Link 
            to="/academy" 
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border border-success/20 hover:border-success/40 transition-all group"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-xl bg-success/20 group-hover:scale-110 transition-transform">
                <Rocket className="h-5 w-5 text-success" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground">Academy</span>
            </div>
          </Link>
        </div>
      </div>

      {/* AI Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm text-primary text-xs font-semibold">
        <Sparkles className="h-3.5 w-3.5" />
        AI Powered
      </div>
    </div>
  );
}