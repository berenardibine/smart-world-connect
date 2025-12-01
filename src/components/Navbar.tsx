import { Link, useLocation } from "react-router-dom";
import { Search, TrendingUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";

export const Navbar = () => {
  const location = useLocation();

  // Hide navbar on seller and admin dashboard pages
  const hiddenPaths = ['/seller', '/admin'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary whitespace-nowrap">
              Rwanda Smart Market
            </div>
          </Link>

          {/* Search Bar - Hidden on mobile, visible on tablet+ */}
          <div className="hidden sm:flex flex-1 max-w-md lg:max-w-lg relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 pr-3 bg-muted/50 w-full h-9 md:h-10" 
            />
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/updates">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1 h-9 px-2 sm:px-3"
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden lg:inline text-sm">Updates</span>
              </Button>
            </Link>

            <Link to="/messages">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1 h-9 px-2 sm:px-3"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden lg:inline text-sm">Messages</span>
              </Button>
            </Link>

            <div className="flex items-center gap-1 px-2 sm:px-3">
              <NotificationBell />
              <span className="hidden lg:inline text-sm">Notifications</span>
            </div>

            <UserMenu />
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="sm:hidden pb-3 pt-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 pr-3 bg-muted/50 w-full h-9" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};
