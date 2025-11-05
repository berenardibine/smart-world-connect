import { Link } from "react-router-dom";
import { Search, Home, TrendingUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <div className="text-xl md:text-2xl font-bold text-primary">
            Rwanda Smart Market
          </div>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>

        {/* Desktop & Mobile Nav */}
        <div className="flex items-center gap-1 md:gap-2">
          <Link to="/" className="md:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/updates">
            <Button variant="ghost" size="icon" className="h-9 w-9 md:w-auto md:px-4">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline ml-2">Updates</span>
            </Button>
          </Link>
          <Link to="/messages">
            <Button variant="ghost" size="icon" className="h-9 w-9 md:w-auto md:px-4">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden md:inline ml-2">Messages</span>
            </Button>
          </Link>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden border-t border-border px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>
    </nav>
  );
};
