// src/data/plans.ts
import type { Plan } from '@/types/subscription';

export const PLANS: Plan[] = [
  {
    key: 'free',
    name: 'Free',
    priceFrw: 0,
    postLimitMonthly: 1,
    updatesLimitMonthly: 0,
    canEditProduct: false,
    description: "Post 1 product/opportunity monthly. Can't create updates or edit products."
  },
  {
    key: 'stone',
    name: 'Stone',
    priceFrw: 1000,
    postLimitMonthly: 5,
    updatesLimitMonthly: 2,
    canEditProduct: true,
    description: "Post 5 items monthly, 2 updates monthly, can edit products."
  },
  {
    key: 'gold',
    name: 'Gold',
    priceFrw: 5000,
    postLimitMonthly: 10,
    updatesLimitMonthly: 10,
    canEditProduct: true,
    description: "Post 10 items monthly, 10 updates monthly, can edit products."
  },
  {
    key: 'silver',
    name: 'Silver',
    priceFrw: 25000,
    postLimitMonthly: 50,
    updatesLimitMonthly: -1,
    canEditProduct: true,
    description: "Post 50 items monthly, unlimited updates."
  },
  {
    key: 'diamond',
    name: 'Diamond',
    priceFrw: 50000,
    postLimitMonthly: 70,
    updatesLimitMonthly: -1,
    canEditProduct: true,
    description: "Post 70 items monthly, unlimited updates and priority."
  },
  {
    key: 'master',
    name: 'Master',
    priceFrw: 100000,
    postLimitMonthly: -1,
    updatesLimitMonthly: -1,
    canEditProduct: true,
    description: "Unlimited posts and updates. Full access."
  }
];
