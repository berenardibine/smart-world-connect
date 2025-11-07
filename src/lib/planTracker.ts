import { Plan } from "@/models/Plan";
import { SellerPlan } from "@/models/SellerPlan";
import { plans } from "@/lib/api/planApi";

// Fake database
let sellerActivity: Record<string, { products: number; updates: number }> = {};

export const getSellerActivity = (userId: string) => {
  return sellerActivity[userId] || { products: 0, updates: 0 };
};

export const recordSellerActivity = (userId: string, type: "product" | "update") => {
  if (!sellerActivity[userId]) {
    sellerActivity[userId] = { products: 0, updates: 0 };
  }

  if (type === "product") {
    sellerActivity[userId].products += 1;
  } else {
    sellerActivity[userId].updates += 1;
  }
};

export const checkPlanLimit = (plan: Plan, userId: string): string | null => {
  const activity = getSellerActivity(userId);
  if (activity.products >= plan.productLimit) {
    return "⚠️ You have reached your monthly product posting limit.";
  }
  if (activity.updates >= plan.updateLimit) {
    return "⚠️ You have reached your monthly update limit.";
  }
  return null; // All good
};

export const resetMonthlyLimits = () => {
  // Called at the beginning of each month
  sellerActivity = {};
};
