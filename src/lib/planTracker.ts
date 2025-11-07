import { supabase } from "@/lib/supabaseClient";

export const recordSellerActivity = async (userId: string, type: "product" | "update") => {
  const month = new Date().toISOString().slice(0, 7); // e.g. 2025-11
  const { data, error } = await supabase
    .from("seller_activity")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  const field = type === "product" ? "products_posted" : "updates_created";

  if (data) {
    const updated = { ...data, [field]: data[field] + 1 };
    await supabase.from("seller_activity").update(updated).eq("id", data.id);
  } else {
    const newRecord = {
      user_id: userId,
      month,
      products_posted: type === "product" ? 1 : 0,
      updates_created: type === "update" ? 1 : 0,
    };
    await supabase.from("seller_activity").insert(newRecord);
  }
};

export const getSellerActivity = async (userId: string) => {
  const month = new Date().toISOString().slice(0, 7);
  const { data, error } = await supabase
    .from("seller_activity")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || { products_posted: 0, updates_created: 0 };
};
