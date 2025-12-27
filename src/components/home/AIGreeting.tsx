import { useState, useEffect } from "react";
import { Sun, Moon, CloudSun, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supaseClient";

export function AIGreeting() {
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [emoji, setEmoji] = useState<React.ReactNode>(<Sun className="h-6 w-6" />);

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
      setEmoji(<Sun className="h-6 w-6 text-warning animate-pulse-soft" />);
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
      setEmoji(<CloudSun className="h-6 w-6 text-primary animate-pulse-soft" />);
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
      setEmoji(<CloudSun className="h-6 w-6 text-primary animate-pulse-soft" />);
    } else {
      setGreeting("Good Night");
      setEmoji(<Moon className="h-6 w-6 text-info animate-pulse-soft" />);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-6 sm:p-8">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="relative flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
          {emoji}
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {greeting}{userName ? `, ${userName}` : ""}! 👋
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Discover amazing deals and connect with local sellers today.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          AI Powered
        </div>
      </div>
    </div>
  );
}
