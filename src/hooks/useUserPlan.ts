import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";
import { useToast } from "@/hooks/use-toast";

export interface UserPlan {
  id: string;
  key: string;
  name: string;
  price_rwf: number;
  post_limit_monthly: number;
  updates_limit_monthly: number;
  can_edit_product: boolean;
  description: string | null;
}

export interface UserActivity {
  posts_this_month: number;
  updates_this_month: number;
  edits_this_month: number;
}

export const useUserPlan = (userId: string | null) => {
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [activity, setActivity] = useState<UserActivity>({ 
    posts_this_month: 0, 
    updates_this_month: 0, 
    edits_this_month: 0 
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPlanAndActivity = async () => {
      try {
        // Get user's subscription and plan
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            plans (*)
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (subError && subError.code !== 'PGRST116') {
          throw subError;
        }

        // If no subscription, get free plan
        if (!subscription) {
          const { data: freePlan, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('key', 'free')
            .single();
          
          if (planError) throw planError;
          setPlan(freePlan);
        } else {
          setPlan(subscription.plans as UserPlan);
        }

        // Get user activity
        const { data: activityData, error: actError } = await supabase
          .from('seller_activity')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (actError && actError.code !== 'PGRST116') {
          throw actError;
        }

        if (activityData) {
          setActivity({
            posts_this_month: activityData.posts_this_month || 0,
            updates_this_month: activityData.updates_this_month || 0,
            edits_this_month: activityData.edits_this_month || 0
          });
        }
      } catch (error: any) {
        console.error('Error fetching plan:', error);
        toast({
          title: "Error",
          description: "Failed to load plan information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlanAndActivity();
  }, [userId, toast]);

  const canPerformAction = async (actionType: 'post' | 'update' | 'edit'): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase.rpc('can_user_perform_action', {
        _user_id: userId,
        _action_type: actionType
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error checking action permission:', error);
      toast({
        title: "Error",
        description: "Failed to check permissions",
        variant: "destructive"
      });
      return false;
    }
  };

  const recordAction = async (actionType: 'post' | 'update' | 'edit'): Promise<void> => {
    if (!userId) return;

    try {
      const { error } = await supabase.rpc('record_user_action', {
        _user_id: userId,
        _action_type: actionType
      });

      if (error) throw error;

      // Refresh activity
      const { data: activityData } = await supabase
        .from('seller_activity')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (activityData) {
        setActivity({
          posts_this_month: activityData.posts_this_month || 0,
          updates_this_month: activityData.updates_this_month || 0,
          edits_this_month: activityData.edits_this_month || 0
        });
      }
    } catch (error: any) {
      console.error('Error recording action:', error);
    }
  };

  return { plan, activity, loading, canPerformAction, recordAction };
};
