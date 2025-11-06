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
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200">
      {/* Main Navbar */}
      <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-4 py-2 md:py-3">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-xl md:text-2xl font-bold text-primary">
            Rwanda Smart Market
          </div>
        </Link>

        {/* Search Bar */}
        <div className="w-full md:w-1/3 my-2 md:my-0 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-10 pr-3 bg-muted/50 w-full" />
        </div>

        {/* Menu & Icons */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link to="/updates">
            <Button variant="ghost" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 h-auto py-2 px-3 md:px-4">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs md:text-sm">Updates</span>
            </Button>
          </Link>

          <Link to="/messages">
            <Button variant="ghost" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 h-auto py-2 px-3 md:px-4">
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs md:text-sm">Messages</span>
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 md:px-4">
            <NotificationBell />
            <span className="text-xs md:text-sm">Notifications</span>
          </div>

          {/* User Menu */}
          <div className="block md:hidden">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
