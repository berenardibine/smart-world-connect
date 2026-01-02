import { Link, useLocation } from "react-router-dom";
import { Home, Store, Globe, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/shop", label: "Shop", icon: Store },
  { path: "/community", label: "Community", icon: Globe },
  { path: "/groups", label: "Groups", icon: UsersRound },
];

export function BottomNav() {
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

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Hide bottom nav on seller and admin dashboard pages
  const hiddenPaths = ['/seller', '/admin', '/auth'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          const badgeCount = badges[item.label.toLowerCase()] || 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 group",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className={cn(
                "relative p-2.5 rounded-2xl transition-all duration-300 transform",
                active 
                  ? "bg-primary/15 scale-110 shadow-lg" 
                  : "group-hover:bg-primary/10 group-hover:scale-105"
              )}
              style={active ? { boxShadow: '0 0 20px hsl(33 100% 50% / 0.3)' } : {}}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  active && "drop-shadow-[0_0_8px_hsl(33_100%_50%_/_0.5)]"
                )} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1 animate-pulse">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium transition-all duration-300",
                active 
                  ? "text-primary font-semibold" 
                  : "text-muted-foreground group-hover:text-primary"
              )}>
                {item.label}
              </span>
              {/* Active glow indicator */}
              {active && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary shadow-[0_0_10px_hsl(33_100%_50%_/_0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
