// src/utils/activityTracker.ts
import { User, PlanKey } from '@/type/subscription';
import { PLANS } from '@/data/plans';
import { mockApi } from '@/api/mockSubscriptionApi';

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
