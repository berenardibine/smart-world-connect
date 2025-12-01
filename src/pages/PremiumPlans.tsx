// src/pages/PremiumPlans.tsx
import React, { useEffect, useState } from "react";
import { PLANS } from "@/data/plans";
import PremiumPlanCard from "@/components/PremiumPlanCard";
import PaymentRequestModal from "@/components/PaymentRequestModal";
import { mockApi } from "@/api/mockSubscriptionApi";
import type { User } from "@/type/subscription";

// For demo: assume current user id stored in localStorage or choose first
const CURRENT_USER_KEY = 'rsm_current_user_demo';

export const PremiumPlansPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showPlan, setShowPlan] = useState<any | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(()=>{
    async function load() {
      // get current user id (demo)
      let uid = localStorage.getItem(CURRENT_USER_KEY);
      if (!uid) {
        // create demo user
        uid = crypto.randomUUID();
        const demoUser: User = {
          id: uid,
          name: 'Demo Seller',
          phone: '+250700000000',
          plan: 'free',
          activity: { postsThisMonth: 0, updatesThisMonth: 0, editsThisMonth: 0, lastResetISO: new Date().toISOString() }
        };
        await mockApi.saveUser(demoUser);
        localStorage.setItem(CURRENT_USER_KEY, uid);
      }
      const u = await mockApi.getUser(uid);
      setUser(u || null);
    }
    load();
  }, [refresh]);

  if (!user) return <div>Loading...</div>;

  const onRequest = (planKey: string) => {
    const plan = PLANS.find(p => p.key === planKey);
    if (!plan) return;
    setShowPlan(plan);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Premium Plans</h1>
      <p className="text-sm text-muted-foreground">Choose a plan that suits your selling needs. Manual payment: <strong>+250798751685 (Manishimwe Berenard)</strong></p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {PLANS.map(plan => (
          <PremiumPlanCard key={plan.key} plan={plan} currentPlanKey={user.plan} onRequest={onRequest} />
        ))}
      </div>

      {showPlan && (
        <PaymentRequestModal
          plan={showPlan}
          userId={user.id}
          onClose={()=>setShowPlan(null)}
          onSubmitted={()=>setRefresh(r=>r+1)}
        />
      )}
    </div>
  );
};
export default PremiumPlansPage;
