import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserRole {
  userType: "buyer" | "seller" | null;
  isAdmin: boolean;
  isLoading: boolean;
  userId: string | null;
}

export function useUserRole(): UserRole {
  const [userType, setUserType] = useState<"buyer" | "seller" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      setUserId(session.user.id);

      // Check profile for user type
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserType(profile.user_type as "buyer" | "seller");
      }

      // Check if admin
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!adminRole);
      setIsLoading(false);
    };

    checkUserRole();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { userType, isAdmin, isLoading, userId };
}
