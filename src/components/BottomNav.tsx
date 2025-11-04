import { Link, useLocation } from "react-router-dom";
import { Home, Sprout, Tractor, Briefcase } from "lucide-react";

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
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
          to="/agriculture"
          className={`flex flex-col items-center justify-center flex-1 ${
            isActive("/agriculture") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Sprout className="h-5 w-5" />
          <span className="text-xs mt-1">Agriculture</span>
        </Link>
        <Link
          to="/equipment"
          className={`flex flex-col items-center justify-center flex-1 ${
            isActive("/equipment") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Tractor className="h-5 w-5" />
          <span className="text-xs mt-1">Equipment</span>
        </Link>
        <Link
          to="/opportunities"
          className={`flex flex-col items-center justify-center flex-1 ${
            isActive("/opportunities") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-xs mt-1">Opportunity</span>
        </Link>
      </div>
    </nav>

  );
}
