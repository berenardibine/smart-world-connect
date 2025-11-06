export interface SellerPlan {
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'expired' | 'rejected';
  paymentPhone?: string;
}
