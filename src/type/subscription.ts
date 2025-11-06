// src/types/subscription.ts
export type PlanKey = 'free' | 'stone' | 'gold' | 'silver' | 'diamond' | 'master';

export interface Plan {
  key: PlanKey;
  name: string;
  priceFrw: number; // 0 if free
  postLimitMonthly: number; // -1 for unlimited
  updatesLimitMonthly: number; // -1 for unlimited
  canEditProduct: boolean;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  phone?: string;
  plan: PlanKey;
  // seller activity counters for current month
  activity: {
    postsThisMonth: number;
    updatesThisMonth: number;
    editsThisMonth: number;
    lastResetISO?: string;
  };
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  requestedPlan: PlanKey;
  amountFrw: number;
  paymentReference?: string; // user provided manual payment reference
  phonePaidTo?: string; // e.g. +250798751685
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAtISO: string;
  reviewedAtISO?: string;
  reviewedBy?: string; // admin id/name
  adminNote?: string;
}
