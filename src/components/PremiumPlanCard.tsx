// src/components/PremiumPlanCard.tsx
import React from "react";
import { Plan } from "@/types/subscription";
import { Button } from "@/components/ui/button";

interface Props {
  plan: Plan;
  currentPlanKey: string;
  onRequest: (planKey: string) => void;
}

export const PremiumPlanCard: React.FC<Props> = ({ plan, currentPlanKey, onRequest }) => {
  const isCurrent = currentPlanKey === plan.key;
  const priceLabel = plan.priceFrw === 0 ? 'Free' : `${plan.priceFrw.toLocaleString()} FRW / month`;
  const postLimit = plan.postLimitMonthly === -1 ? 'Unlimited' : `${plan.postLimitMonthly} / month`;
  const updates = plan.updatesLimitMonthly === -1 ? 'Unlimited' : `${plan.updatesLimitMonthly} / month`;

  return (
    <div className={`border rounded-xl p-4 shadow-sm bg-white`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">{priceLabel}</div>
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        <li><strong>Posts:</strong> {postLimit}</li>
        <li><strong>Updates:</strong> {updates}</li>
        <li><strong>Edit products:</strong> {plan.canEditProduct ? 'Yes' : 'No'}</li>
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Pay manually to +250798751685 (Manishimwe Berenard)</span>
        <div>
          {isCurrent ? (
            <Button variant="default" disabled>Current plan</Button>
          ) : (
            <Button onClick={() => onRequest(plan.key)}>Request {plan.priceFrw === 0 ? 'Free' : 'Subscribe'}</Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default PremiumPlanCard;
