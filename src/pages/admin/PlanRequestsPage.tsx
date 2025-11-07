import { useEffect, useState } from "react";
import { getPendingRequests, reviewUpgradeRequest } from "@/lib/api/planApi";
import { Button } from "@/components/ui/button";
import { SellerPlan } from "@/models/SellerPlan";

export const PlanRequestsPage = () => {
  const [requests, setRequests] = useState<SellerPlan[]>([]);

  useEffect(() => {
    getPendingRequests().then(setRequests);
  }, []);

  const handleReview = async (userId: string, action: 'approve' | 'reject') => {
    const message = await reviewUpgradeRequest(userId, action);
    alert(message);
    setRequests(await getPendingRequests());
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
// src/pages/admin/PlanRequestsPage.tsx
import React, { useEffect, useState } from 'react';
import { getPendingRequests, reviewUpgradeRequest, subscribeToPendingRequests } from '@/lib/api/supabasePlanApi';
import { Button } from '@/components/ui/button';

export const PlanRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const r = await getPendingRequests();
      if (mounted) setRequests(r || []);
    })();

    // subscribe to realtime changes (new pending)
    const channel = subscribeToPendingRequests((payload) => {
      // payload.record contains changed row
      // refresh list on change for simplicity
      (async () => {
        const r = await getPendingRequests();
        setRequests(r || []);
      })();
    });

    return () => {
      mounted = false;
      if (channel && 'unsubscribe' in channel) (channel as any).unsubscribe();
    };
  }, []);

  const handle = async (id: string, action: 'approve'|'reject') => {
    const ok = confirm(`Are you sure to ${action} this request?`);
    if (!ok) return;
    try {
      await reviewUpgradeRequest(id, action === 'approve', 'Admin');
      alert('Reviewed');
      const r = await getPendingRequests();
      setRequests(r || []);
    } catch (e:any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Pending Plan Requests</h1>
      <div className="space-y-4">
        {requests.length === 0 && <div>No pending requests.</div>}
        {requests.map(req => (
          <div key={req.id} className="border rounded p-4 flex justify-between items-start">
            <div>
              <div className="font-semibold">{req.plans?.name || req.plan_id} • {req.amount || ''}</div>
              <div className="text-sm text-muted-foreground">User: {req.user_id} • {new Date(req.created_at).toLocaleString()}</div>
              <div className="mt-2 text-sm">Phone: {req.payment_phone} • Ref: {req.payment_reference || '-'}</div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => handle(req.id, 'approve')} className="bg-green-600 text-white">Approve</Button>
              <Button onClick={() => handle(req.id, 'reject')} className="bg-red-600 text-white">Reject</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
