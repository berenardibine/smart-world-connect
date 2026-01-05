import { Link, useLocation } from "react-router-dom";
import { Home, Store, Globe, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";

const navItems = [
  { path: "/", label: "Home", icon: Home, badgeType: "home" },
  { path: "/shop", label: "Shop", icon: Store },
  { path: "/community", label: "Community", icon: Globe, badgeType: "community" },
  { path: "/groups", label: "Groups", icon: UsersRound, badgeType: "groups" },
];

export function BottomNav() {
  const location = useLocation();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    loadBadges();
    
    // Set up realtime subscription for badge updates
    const channel = supabase
      .channel("badges-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_badges" },
        () => {
          loadBadges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Hide bottom nav on seller and admin dashboard pages
  const hiddenPaths = ['/seller', '/admin', '/auth'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Glassmorphism background */}
      <div className="mx-2 mb-2 sm:mx-4 sm:mb-3 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-float">
        <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            const badgeCount = item.badgeType ? badges[item.badgeType] || 0 : 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 group",
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "relative p-2 rounded-xl transition-all duration-300",
                  active && "bg-primary/10 shadow-sm animate-scale-in"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    active ? "scale-110" : "group-hover:scale-105"
                  )} />
                  
                  {/* Badge counter */}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1 animate-bounce-soft shadow-md">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                  
                  {/* Active indicator dot */}
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-glow" />
                  )}
                </div>
                
                <span className={cn(
                  "text-xs mt-1 font-medium transition-all duration-300",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
