import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/UserMenu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  // Hide navbar on seller and admin dashboard pages (buyers only)
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

          {/* Menu Button & User Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <nav className="flex flex-col gap-4 mt-8">
                      <Link 
                        to="/updates" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-base font-medium">Updates</span>
                      </Link>
                      <Link 
                        to="/messages" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-base font-medium">Messages</span>
                      </Link>
                      <Link 
                        to="/account" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-base font-medium">Account</span>
                      </Link>
                    </nav>
                  </SheetContent>
                </Sheet>
                <UserMenu />
              </>
            ) : (
              <Link to="/auth?mode=signup">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            )}
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
