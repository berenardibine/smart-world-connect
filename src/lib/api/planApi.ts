import { supabase } from "@/lib/supabaseClient";

export const getPlans = async () => {
  const { data, error } = await supabase.from("plans").select("*").order("price", { ascending: true });
  if (error) throw error;
  return data;
};

export const requestPlanUpgrade = async (userId: string, planId: string) => {
  const { data, error } = await supabase.from("seller_plans").insert([
    {
      user_id: userId,
      plan_id: planId,
      status: "pending",
      payment_phone: "+250798751685",
      start_date: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
  return data;
};

export const getPendingRequests = async () => {
  const { data, error } = await supabase.from("seller_plans").select("*").eq("status", "pending");
  if (error) throw error;
  return data;
};

export const reviewUpgradeRequest = async (id: string, action: 'approve' | 'reject') => {
  const { error } = await supabase
    .from("seller_plans")
    .update({ status: action === "approve" ? "active" : "rejected" })
    .eq("id", id);
  if (error) throw error;
  return action === "approve" ? "Plan approved ✅" : "Request rejected ❌";
};
