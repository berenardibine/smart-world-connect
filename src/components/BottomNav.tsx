import { Link, useLocation } from "react-router-dom";
import { Home, Sprout, Store, Megaphone, Briefcase } from "lucide-react";

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Hide bottom nav on seller and admin dashboard pages
  const hiddenPaths = ['/seller', '/admin'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex justify-around items-center h-16 px-2">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 ${
            isActive("/") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          to="/shops"
          className={`flex flex-col items-center justify-center flex-1 ${
            isActive("/shops") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Store className="h-5 w-5" />
          <span className="text-xs mt-1">Shops</span>
        </Link>
        <Link
          to="/agriculture"
          className={`flex flex-col items-center justify-center flex-1 ${
            isActive("/agriculture") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Sprout className="h-5 w-5" />
          <span className="text-xs mt-1">Agri</span>
        </Link>
        <Link
          to="/opportunities"
          className={`flex flex-col items-center justify-center flex-1 ${
            isActive("/opportunities") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-xs mt-1">Jobs</span>
        </Link>
        <Link
          to="/marketing"
          className={`flex flex-col items-center justify-center flex-1 ${
            isActive("/marketing") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Megaphone className="h-5 w-5" />
          <span className="text-xs mt-1">Updates</span>
        </Link>
      </div>
    </nav>

  );
}
