import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

export function DashboardFloatingButton() {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading || !isAdmin) return null;

  return (
    <div className="fixed bottom-40 right-4 z-50 flex flex-col gap-2">
      <Link to="/admin/dashboard">
        <Button 
          size="lg" 
          variant="destructive"
          className="rounded-full shadow-lg gap-2"
        >
          <Shield className="h-5 w-5" />
          <span className="hidden sm:inline">Admin Dashboard</span>
        </Button>
      </Link>
    </div>
  );
}
