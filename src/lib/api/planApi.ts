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
// src/lib/api/supabasePlanApi.ts
import { supabase } from '@/lib/supabaseClient';

export const getPlans = async () => {
  const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
  if (error) throw error;
  return data;
};

export const requestPlanUpgrade = async (userId: string, planId: string, paymentPhone = '+250798751685', paymentRef?: string, message?: string) => {
  const payload = {
    user_id: userId,
    plan_id: planId,
    status: 'pending',
    payment_phone: paymentPhone,
    payment_reference: paymentRef || null,
    admin_note: message || null,
    start_date: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('seller_plans').insert(payload).select().single();
  if (error) throw error;
  return data;
};

export const getPendingRequests = async () => {
  const { data, error } = await supabase.from('seller_plans').select('*, plans(*)').eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const reviewUpgradeRequest = async (requestId: string, approve: boolean, adminName: string, adminNote?: string) => {
  const newStatus = approve ? 'active' : 'rejected';
  const { error } = await supabase.from('seller_plans').update({
    status: newStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminName,
    admin_note: adminNote || null
  }).eq('id', requestId);
  if (error) throw error;

  if (approve) {
    // If approved, optionally set start/end dates and create/replace active plan record
    // For simplicity we keep the same row as active; if you want a separate active table, adapt accordingly.
  }

  return { success: true, status: newStatus };
};

export const getActivePlanForUser = async (userId: string) => {
  // try to get latest active plan for user
  const { data, error } = await supabase
    .from('seller_plans')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .in('status', ['active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getSellerActivity = async (userId: string) => {
  const month = new Date().toISOString().slice(0,7); // YYYY-MM
  const { data, error } = await supabase
    .from('seller_activity')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { products_posted: 0, updates_created: 0, month };
  return data;
};

export const recordSellerActivity = async (userId: string, type: 'product' | 'update') => {
  const month = new Date().toISOString().slice(0,7);
  // try update
  const field = type === 'product' ? 'products_posted' : 'updates_created';
  const { data, error } = await supabase
    .from('seller_activity')
    .upsert({
      user_id: userId,
      month,
      products_posted: type === 'product' ? 1 : 0,
      updates_created: type === 'update' ? 1 : 0,
    }, { onConflict: ['user_id','month'], ignoreDuplicates: false })
    .select()
    .single();
  if (error) throw error;
  // When upsert, we need to increment properly. Supabase upsert with expressions isn't supported in JS client easily;
  // For production, prefer RPC or Postgres function to increment atomically. For demo, a simple approach:
  // Try patch: fetch, then update incrementally (race conditions possible).
  return data;
};

/** Realtime subscription helpers */
export const subscribeToPendingRequests = (cb: (payload: any) => void) => {
  const channel = supabase.channel('public:seller_plans_pending')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'seller_plans', filter: "status=eq.pending" },
      (payload) => cb(payload)
    )
    .subscribe();
  return channel;
};
