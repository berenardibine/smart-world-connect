import { supabase } from "@/integrations/supabase/client";

export const recordSellerActivity = async (userId: string, type: "product" | "update") => {
  // Tables don't exist yet, just log
  console.log('Activity recorded:', { userId, type });
};

export const getSellerActivity = async (userId: string) => {
  // Tables don't exist yet, return mock data
  return { products_posted: 0, updates_created: 0 };
};
