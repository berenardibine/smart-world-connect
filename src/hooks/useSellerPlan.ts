import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getPlans } from "@/lib/api/planApi";
import { recordSellerActivity, getSellerActivity } from "@/lib/planTracker";

export const useSellerPlan = (userId: string) => {
  const [plan, setPlan] = useState<any>(null);
  const [activity, setActivity] = useState<any>({ products_posted: 0, updates_created: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("seller_plans")
        .select("*, plans(*)")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();
      setPlan(data);
      const act = await getSellerActivity(userId);
      setActivity(act);
    };
    fetchData();
  }, [userId]);

  const canPost = (type: "product" | "update") => {
    if (!plan) return false;
    const limit = type === "product" ? plan.plans.product_limit : plan.plans.update_limit;
    const current = type === "product" ? activity.products_posted : activity.updates_created;
    if (limit !== null && current >= limit) {
      alert("⚠️ You’ve reached your monthly limit for this plan.");
      return false;
    }
    recordSellerActivity(userId, type);
    return true;
  };

  return { plan, activity, canPost };
};
