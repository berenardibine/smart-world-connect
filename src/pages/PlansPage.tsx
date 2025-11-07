import { Button } from "@/components/ui/button";
import { plans, requestPlanUpgrade } from "@/lib/api/planApi";

export const PlansPage = () => {
  const handleRequest = async (planId: string, planName: string) => {
    const res = await requestPlanUpgrade("USER001", planId);
    alert(`✅ Request for ${planName} sent!\nPlease pay to +250798751685 and wait for admin approval.`);
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold text-center mb-6 text-orange-600">
        Choose Your Seller Plan
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="border rounded-xl p-5 shadow hover:shadow-lg bg-white text-center"
          >
            <h2 className="text-xl font-semibold text-orange-500">{plan.name}</h2>
            <p className="text-2xl font-bold my-3">{plan.price} RWF / month</p>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <Button
              onClick={() => handleRequest(plan.id, plan.name)}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              Request this Plan
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
