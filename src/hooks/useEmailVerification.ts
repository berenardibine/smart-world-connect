import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";

export function useEmailVerification(redirectOnUnverified: boolean = true) {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsVerified(null);
        setIsLoading(false);
        return;
      }

      const verified = !!session.user.email_confirmed_at;
      setIsVerified(verified);
      setIsLoading(false);

      if (!verified && redirectOnUnverified) {
        navigate("/verify-email");
      }
    };

    checkVerification();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const verified = !!session.user.email_confirmed_at;
        setIsVerified(verified);
        
        if (!verified && redirectOnUnverified) {
          navigate("/verify-email");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectOnUnverified]);

  const requireVerification = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return false;
    }

    if (!session.user.email_confirmed_at) {
      navigate("/verify-email");
      return false;
    }

    return true;
  };

  return { isVerified, isLoading, requireVerification };
}
