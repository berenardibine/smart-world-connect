import { Link, useLocation } from "react-router-dom";
import { Video, MessageCircle, Phone, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/videos", label: "Videos", icon: Video },
  { path: "/messages", label: "Messages", icon: MessageCircle },
  { path: "/contacts", label: "Contacts", icon: Phone },
  { path: "/rewards", label: "Challenges", icon: Trophy },
];

export function HorizontalNav() {
  const location = useLocation();

  return (
    <div className="bg-background/80 backdrop-blur-md border-b border-border sticky top-[60px] md:top-[72px] z-40">
      <div className="container mx-auto px-2">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
