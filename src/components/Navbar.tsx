import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Bell, ShoppingBag, Globe, Download, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/lib/supaseClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    // Check if PWA is installable
    const checkInstallable = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const installed = localStorage.getItem('pwa_installed') === 'true';
      setShowInstallButton(!isStandalone && !installed);
    };
    checkInstallable();

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  // Hide navbar on seller and admin dashboard pages
  const hiddenPaths = ['/seller', '/admin'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search navigation
    console.log("Searching:", searchQuery);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-glow transition-transform group-hover:scale-105">
              <img src="/favicon.png" alt="Smart World Connect" className="w-full h-full object-cover" />
            </div>
            <span className="hidden sm:block text-xl font-bold text-foreground">
              Smart<span className="text-primary">World</span>
            </span>
          </Link>

          {/* AI Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
            <div className="relative w-full">
              <Sparkles className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input 
                placeholder="Find the best deals near you..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 h-11 rounded-2xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 placeholder:text-muted-foreground/70" 
              />
              <Button 
                type="submit" 
                size="sm" 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl h-8 px-4"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Country Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden lg:flex rounded-xl">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2">
                  🇷🇼 Rwanda
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" disabled>
                  🇰🇪 Kenya (Coming Soon)
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" disabled>
                  🇺🇬 Uganda (Coming Soon)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Install App Button */}
            {showInstallButton && (
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden lg:flex gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}

            {isLoggedIn ? (
              <>
                <NotificationBell />
                <UserMenu />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth?mode=login">
                  <Button variant="ghost" size="sm" className="hidden sm:flex rounded-xl">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm" className="rounded-xl px-4">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Sparkles className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input 
              placeholder="Find the best deals near you..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-12 h-11 rounded-2xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/30" 
            />
            <Button 
              type="submit" 
              size="sm" 
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl h-8 w-8 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
};
