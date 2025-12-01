import { useEffect, useState } from "react";
import { getPendingRequests, reviewUpgradeRequest } from "@/lib/api/planApi";
import { Button } from "@/components/ui/button";

interface PlanRequest {
  userId: string;
  planId: string;
  paymentPhone: string;
}

export const PlanRequestsPage = () => {
  const [requests, setRequests] = useState<PlanRequest[]>([]);

  useEffect(() => {
    getPendingRequests().then((data) => setRequests(data as any));
  }, []);

  const handleReview = async (userId: string, action: 'approve' | 'reject') => {
    const message = await reviewUpgradeRequest(userId, action);
    alert(message);
    const data = await getPendingRequests();
    setRequests(data as any);
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 text-orange-600">Pending Plan Requests</h1>
      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-orange-50">
            <tr>
              <th className="p-3 text-left">User ID</th>
              <th className="p-3 text-left">Plan ID</th>
              <th className="p-3 text-left">Payment</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.userId} className="border-t border-gray-100">
                <td className="p-3">{req.userId}</td>
                <td className="p-3">{req.planId}</td>
                <td className="p-3">{req.paymentPhone}</td>
                <td className="p-3 flex gap-2">
                  <Button onClick={() => handleReview(req.userId, "approve")} className="bg-green-600 text-white">
                    Approve
                  </Button>
                  <Button onClick={() => handleReview(req.userId, "reject")} className="bg-red-500 text-white">
                    Reject
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};