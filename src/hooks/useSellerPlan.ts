import { useEffect, useState } from "react";
import { supabase } from "@/lib/supaseClient";
import { getPlans } from "@/lib/api/planApi";

export const useSellerPlan = (userId: string) => {
  const [plan, setPlan] = useState<any>(null);
  const [activity, setActivity] = useState<any>({ products_posted: 0, updates_created: 0 });

  useEffect(() => {
    const fetchData = async () => {
      // Tables don't exist yet, use mock data
      setPlan({ plans: { product_limit: null, update_limit: null } });
      setActivity({ products_posted: 0, updates_created: 0 });
    };
    fetchData();
  }, [userId]);

  const canPost = (type: "product" | "update") => {
    if (!plan) return true; // Allow posting when no plan is set
    const limit = type === "product" ? plan.plans.product_limit : plan.plans.update_limit;
    const current = type === "product" ? activity.products_posted : activity.updates_created;
    if (limit !== null && current >= limit) {
      alert("⚠️ You've reached your monthly limit for this plan.");
      return false;
    }
    return true;
  };

  return { plan, activity, canPost };
};