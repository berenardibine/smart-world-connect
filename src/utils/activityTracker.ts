// src/utils/activityTracker.ts
import { User, PlanKey } from '@/type/subscription';
import { PLANS } from '@/data/plans';
import { mockApi } from '@/api/mockSubscriptionApi';
import { supabase } from "@/lib/supaseClient";

let lastActivityUpdate = 0;
const UPDATE_INTERVAL = 60000; // Update every minute at most

export const updateLastActive = async () => {
  const now = Date.now();
  
  // Throttle updates to once per minute
  if (now - lastActivityUpdate < UPDATE_INTERVAL) return;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    
    await supabase
      .from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", session.user.id);
    
    lastActivityUpdate = now;
  } catch (error) {
    console.error("Failed to update last_active:", error);
  }
};

// Format relative time for activity status
export const getActiveStatus = (lastActive: string | null): { text: string; color: string } => {
  if (!lastActive) return { text: "Offline", color: "text-muted-foreground" };
  
  const now = new Date();
  const last = new Date(lastActive);
  const diffMs = now.getTime() - last.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 2) {
    return { text: "Active now", color: "text-green-500" };
  } else if (diffMinutes < 60) {
    return { text: `Active ${diffMinutes}m ago`, color: "text-orange-500" };
  } else if (diffHours < 24) {
    return { text: `Active ${diffHours}h ago`, color: "text-muted-foreground" };
  } else {
    return { text: `Active ${diffDays}d ago`, color: "text-muted-foreground" };
  }
};

/**
 * Returns plan meta by key
 */
export function getPlanByKey(k: PlanKey) {
  return PLANS.find(p => p.key === k)!;
}

/**
 * Check if user can post/create an item now (based on plan limits).
 */
export async function canUserPost(user: User): Promise<{allowed: boolean; reason?: string}> {
  const plan = getPlanByKey(user.plan);
  if (plan.postLimitMonthly === -1) return { allowed: true };
  if (user.activity.postsThisMonth < plan.postLimitMonthly) return { allowed: true };
  return { allowed: false, reason: `Monthly post limit reached (${plan.postLimitMonthly}).` };
}

/**
 * Increment user activity counters (e.g., after posting)
 */
export async function recordUserPost(userId: string) {
  const u = await mockApi.getUser(userId);
  if (!u) throw new Error('User not found');
  u.activity.postsThisMonth = (u.activity.postsThisMonth || 0) + 1;
  await mockApi.saveUser(u);
}

/**
 * Reset monthly counters (simple: should be run by cron/back-end monthly).
 * For this mock, we offer a simple check-and-reset if month changed.
 */
export function ensureMonthlyReset(user: User) {
  const lastReset = user.activity.lastResetISO ? new Date(user.activity.lastResetISO) : null;
  const now = new Date();
  if (!lastReset || lastReset.getUTCFullYear() !== now.getUTCFullYear() || lastReset.getUTCMonth() !== now.getUTCMonth()) {
    user.activity.postsThisMonth = 0;
    user.activity.updatesThisMonth = 0;
    user.activity.editsThisMonth = 0;
    user.activity.lastResetISO = now.toISOString();
  }
}
