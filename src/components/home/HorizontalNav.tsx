import { Link, useLocation } from "react-router-dom";
import { Video, MessageCircle, Phone, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";

const navItems = [
  { path: "/videos", label: "Videos", icon: Video, badgeType: "videos" },
  { path: "/messages", label: "Messages", icon: MessageCircle, badgeType: "messages" },
  { path: "/contacts", label: "Contacts", icon: Phone },
  { path: "/rewards", label: "Challenge", icon: Trophy, badgeType: "challenges" },
];

export function HorizontalNav() {
  const location = useLocation();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("notification_badges")
        .select("badge_type, count")
        .eq("user_id", session.user.id);
      
      if (data) {
        const badgeMap: Record<string, number> = {};
        data.forEach(b => {
          badgeMap[b.badge_type] = b.count;
        });
        setBadges(badgeMap);
      }
    }
  };

  return (
    <div className="bg-card/95 backdrop-blur-xl border-b border-border/50 sticky top-[56px] md:top-[64px] z-40 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <nav className="flex items-center justify-center gap-1 sm:gap-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const badgeCount = item.badgeType ? badges[item.badgeType] || 0 : 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 sm:px-5 py-2 rounded-xl text-xs font-medium transition-all duration-300 group min-w-[60px] sm:min-w-[70px]",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {/* Icon with badge */}
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 sm:h-5 sm:w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  
                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full px-0.5 shadow-sm">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className="text-[10px] sm:text-xs">{item.label}</span>
                
                {/* Active indicator glow */}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary animate-scale-in" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
