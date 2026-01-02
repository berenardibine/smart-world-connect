import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Bell, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { SearchOverlay } from "@/components/SearchOverlay";
import { supabase } from "@/lib/supaseClient";

export const Navbar = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg transition-transform group-hover:scale-105 ring-2 ring-primary/20">
                <img src="/favicon.png" alt="Smart World Connect" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold text-foreground leading-tight">
                  Smart<span className="text-primary">World</span>
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">Connect</span>
              </div>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Install App Button */}
              {showInstallButton && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden lg:flex gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Download className="h-4 w-4" />
                  Install
                </Button>
              )}

              {isLoggedIn ? (
                <>
                  <NotificationBell />
                  <UserMenu />
                </>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link to="/auth?mode=login">
                    <Button variant="ghost" size="sm" className="rounded-xl text-sm px-3">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup">
                    <Button size="sm" className="rounded-xl px-3 sm:px-4 text-sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
