import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useUserStatus() {
  const navigate = useNavigate();

  useEffect(() => {
    checkStatus();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload: any) => {
          const session = supabase.auth.getSession();
          session.then(({ data: { session } }) => {
            if (session && payload.new.id === session.user.id) {
              if (payload.new.status !== 'active') {
                navigate('/blocked-account');
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const checkStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', session.user.id)
      .single();

    if (data && data.status !== 'active') {
      navigate('/blocked-account');
    }
  };
}
