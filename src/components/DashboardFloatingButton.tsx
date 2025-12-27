import { Link } from "react-router-dom";
import { LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

export function DashboardFloatingButton() {
  const { userType, isAdmin, isLoading } = useUserRole();

  if (isLoading) return null;

  // Show nothing for buyers (they're already on the buyer view)
  if (!isAdmin && userType !== "seller") return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
      {userType === "seller" && (
        <Link to="/seller/dashboard">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg gap-2"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="hidden sm:inline">Seller Dashboard</span>
          </Button>
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin">
          <Button 
            size="lg" 
            variant="destructive"
            className="rounded-full shadow-lg gap-2"
          >
            <Shield className="h-5 w-5" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Button>
        </Link>
      )}
    </div>
  );
}
