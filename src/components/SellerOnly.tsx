import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function SellerOnly({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkSeller();
  }, []);

  const checkSeller = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, identity_verified")
      .eq("id", session.user.id)
      .single();

    if (profile?.user_type !== "seller") {
      navigate("/");
      return;
    }

    if (!profile?.identity_verified) {
      navigate("/identity-verification");
      return;
    }

    setIsSeller(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return isSeller ? <>{children}</> : null;
}
