import { supabase } from "@/lib/supaseClient";

// Mock plans data for compatibility
export const plans = [
  { id: "basic", name: "Basic", price: 5000, description: "Perfect for getting started" },
  { id: "pro", name: "Pro", price: 15000, description: "For growing businesses" },
  { id: "premium", name: "Premium", price: 30000, description: "Full features unlocked" }
];

export const getPlans = async () => {
  // Tables don't exist yet, return mock data
  return plans;
};

export const requestPlanUpgrade = async (userId: string, planId: string) => {
  // Tables don't exist yet, return mock data
  console.log('Plan upgrade requested:', { userId, planId });
  return { success: true };
};

export const getPendingRequests = async () => {
  // Tables don't exist yet, return empty array
  return [];
};

export const reviewUpgradeRequest = async (id: string, action: 'approve' | 'reject') => {
  // Tables don't exist yet, return mock response
  return action === "approve" ? "Plan approved ✅" : "Request rejected ❌";
};