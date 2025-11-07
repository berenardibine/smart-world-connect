import { Plan } from "@/models/Plan";
import { SellerPlan } from "@/models/SellerPlan";

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    productLimit: 1,
    updateLimit: 0,
    canEditProducts: false,
    description: "Post 1 product or opportunity monthly. Cannot edit or update products.",
  },
  {
    id: "stone",
    name: "Stone",
    price: 1000,
    productLimit: 5,
    updateLimit: 2,
    canEditProducts: true,
    description: "Post 5 products or opportunities, 2 updates monthly, can edit products.",
  },
  {
    id: "gold",
    name: "Gold",
    price: 5000,
    productLimit: 10,
    updateLimit: 10,
    canEditProducts: true,
    description: "Post 10 products and 10 updates monthly, can edit products.",
  },
  {
    id: "silver",
    name: "Silver",
    price: 25000,
    productLimit: 50,
    updateLimit: Infinity,
    canEditProducts: true,
    description: "Post 50 products monthly, unlimited updates.",
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 50000,
    productLimit: 70,
    updateLimit: Infinity,
    canEditProducts: true,
    description: "Post 70 products and unlimited updates.",
  },
  {
    id: "master",
    name: "Master",
    price: 100000,
    productLimit: Infinity,
    updateLimit: Infinity,
    canEditProducts: true,
    description: "Unlimited everything.",
  },
];

let requests: SellerPlan[] = [];

export const requestPlanUpgrade = async (userId: string, planId: string): Promise<SellerPlan> => {
  const newRequest: SellerPlan = {
    userId,
    planId,
    startDate: new Date().toISOString(),
    endDate: "",
    status: "pending",
    paymentPhone: "+250798751685",
  };
  requests.push(newRequest);
  return newRequest;
};

export const getPendingRequests = async (): Promise<SellerPlan[]> => {
  return requests.filter(r => r.status === "pending");
};

export const reviewUpgradeRequest = async (
  userId: string,
  action: 'approve' | 'reject'
): Promise<string> => {
  const req = requests.find(r => r.userId === userId && r.status === "pending");
  if (!req) return "No pending request found.";

  req.status = action === 'approve' ? 'active' : 'rejected';
  return action === 'approve' ? "Plan approved ✅" : "Request rejected ❌";
};
