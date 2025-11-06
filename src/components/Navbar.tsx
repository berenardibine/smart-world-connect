import { Link, useLocation } from "react-router-dom";
import { Search, TrendingUp, MessageCircle, Bell, User } from "lucide-react";
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
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-xl md:text-2xl font-bold text-primary">
            Rwanda Smart Market
          </div>
        </Link>
        <div className="md:hidden">
          <UserMenu />
        </div>
      </div>

      {/* Search Bar */}
      <div className="container py-3 border-t border-border">
        <div className="relative max-w-3xl mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="border-t border-border bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-center md:justify-start gap-1 py-2">
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
            <div className="hidden md:block">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
