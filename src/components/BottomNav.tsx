import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, LayoutDashboard, TrendingUp, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function BottomNav() {
  const location = useLocation();
  const [userType, setUserType] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .single();

    setUserType(profile?.user_type || null);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!roleData);
  };

  const isActive = (path: string) => location.pathname === path;

  if (isAdmin) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            <Link to="/admin/dashboard" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/admin/dashboard") ? "text-primary" : "text-muted-foreground"}`}>
              <LayoutDashboard className="h-6 w-6 mb-1" />
              <span className="text-xs">Dashboard</span>
            </Link>
            <Link to="/messages" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/messages") ? "text-primary" : "text-muted-foreground"}`}>
              <MessageCircle className="h-6 w-6 mb-1" />
              <span className="text-xs">Messages</span>
            </Link>
            <Link to="/account" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/account") ? "text-primary" : "text-muted-foreground"}`}>
              <User className="h-6 w-6 mb-1" />
              <span className="text-xs">Account</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  if (userType === "buyer") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            <Link to="/" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}>
              <Home className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Home</span>
            </Link>
            <Link to="/agriculture" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/agriculture") ? "text-primary" : "text-muted-foreground"}`}>
              <LayoutDashboard className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Agriculture</span>
            </Link>
            <Link to="/equipment" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/equipment") ? "text-primary" : "text-muted-foreground"}`}>
              <LayoutDashboard className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Equipment</span>
            </Link>
            <Link to="/messages" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/messages") ? "text-primary" : "text-muted-foreground"}`}>
              <MessageCircle className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Messages</span>
            </Link>
            <Link to="/updates" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/updates") ? "text-primary" : "text-muted-foreground"}`}>
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Updates</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          <Link to="/seller/dashboard" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/seller/dashboard") ? "text-primary" : "text-muted-foreground"}`}>
            <LayoutDashboard className="h-6 w-6 mb-1" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link to="/seller/updates" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/seller/updates") ? "text-primary" : "text-muted-foreground"}`}>
            <Plus className="h-6 w-6 mb-1" />
            <span className="text-xs">Post Update</span>
          </Link>
          <Link to="/messages" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/messages") ? "text-primary" : "text-muted-foreground"}`}>
            <MessageCircle className="h-6 w-6 mb-1" />
            <span className="text-xs">Messages</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
