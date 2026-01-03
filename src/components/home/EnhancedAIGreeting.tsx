import { useState, useEffect } from "react";
import { Sun, Moon, CloudSun, Sparkles, PenLine, Camera, Brain } from "lucide-react";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";

export function EnhancedAIGreeting({ onCreatePost }: { onCreatePost?: () => void }) {
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [subtext, setSubtext] = useState("");
  const [emoji, setEmoji] = useState("🌅");
  const [EmojiIcon, setEmojiIcon] = useState<React.ComponentType<any>>(() => Sun);

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
      setSubtext("Ready to share something amazing?");
      setEmoji("🌅");
      setEmojiIcon(() => Sun);
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
      setSubtext("What inspiring thoughts do you have?");
      setEmoji("☀️");
      setEmojiIcon(() => CloudSun);
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
      setSubtext("Time to reflect and connect!");
      setEmoji("🌆");
      setEmojiIcon(() => CloudSun);
    } else {
      setGreeting("Good Night");
      setSubtext("Any midnight thoughts to share?");
      setEmoji("🌙");
      setEmojiIcon(() => Moon);
    }
  };

  const Icon = EmojiIcon;

  return (
    <div className="relative overflow-hidden rounded-3xl animated-gradient p-6 sm:p-8">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary-foreground/30 animate-bounce-soft" style={{ animationDelay: "0s" }} />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-primary-foreground/20 animate-bounce-soft" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-primary-foreground/25 animate-bounce-soft" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-primary-foreground/30 animate-bounce-soft" style={{ animationDelay: "1.5s" }} />
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/5 rounded-full blur-2xl" />
      
      <div className="relative text-primary-foreground">
        {/* Greeting */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              {greeting}{userName ? `, ${userName}` : ""}! 
              <span className="text-2xl">{emoji}</span>
            </h2>
          </div>
        </div>
        
        <p className="text-primary-foreground/80 text-base sm:text-lg mb-6 ml-1">
          {subtext}
            </p>
      </div>
    </div>
  );
}
