import { useState, useEffect } from "react";
import { plans } from "@/lib/api/planApi";
import { SellerPlan } from "@/models/SellerPlan";
import { checkPlanLimit, recordSellerActivity } from "@/lib/planTracker";

export const useSellerPlan = (userId: string) => {
  const [sellerPlan, setSellerPlan] = useState<SellerPlan | null>(null);
  const [planInfo, setPlanInfo] = useState<any>(null);

  useEffect(() => {
    // Fake load user active plan
    const activePlan: SellerPlan = {
      userId,
      planId: "gold", // You can dynamically load from backend
      startDate: "2025-11-01",
      endDate: "2025-12-01",
      status: "active",
    };
    setSellerPlan(activePlan);

    const plan = plans.find((p) => p.id === activePlan.planId);
    setPlanInfo(plan);
  }, [userId]);

  const canPostProduct = (): boolean => {
    if (!sellerPlan || !planInfo) return false;
    const warning = checkPlanLimit(planInfo, userId);
    if (warning) {
      alert(warning);
      return false;
    }
    recordSellerActivity(userId, "product");
    return true;
  };

  const canPostUpdate = (): boolean => {
    if (!sellerPlan || !planInfo) return false;
    const warning = checkPlanLimit(planInfo, userId);
    if (warning) {
      alert(warning);
      return false;
    }
    recordSellerActivity(userId, "update");
    return true;
  };

  return { sellerPlan, planInfo, canPostProduct, canPostUpdate };
};
