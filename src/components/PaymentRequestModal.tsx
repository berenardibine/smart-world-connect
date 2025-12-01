// src/components/PaymentRequestModal.tsx
import React, { useState } from "react";
import { Plan } from "@/type/subscription";

interface Props {
  plan: Plan;
  userId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

import { mockApi } from "@/api/mockSubscriptionApi";

export const PaymentRequestModal: React.FC<Props> = ({ plan, userId, onClose, onSubmitted }) => {
  const [txRef, setTxRef] = useState('');
  const [phonePaid, setPhonePaid] = useState('+250798751685');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await mockApi.submitSubscriptionRequest({
        userId,
        requestedPlan: plan.key,
        amountFrw: plan.priceFrw,
        paymentReference: txRef || undefined,
        phonePaidTo: phonePaid,
        message
      });
      onSubmitted();
      onClose();
    } catch (e) {
      alert('Failed to submit request: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-2">Request {plan.name}</h3>
        <p className="text-sm text-muted-foreground">Send payment manually to <strong>+250798751685 (Manishimwe Berenard)</strong> and provide a payment reference below. Admin will review and approve.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm">Payment phone (where you paid)</label>
            <input value={phonePaid} onChange={e=>setPhonePaid(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Payment reference (optional)</label>
            <input value={txRef} onChange={e=>setTxRef(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Message (optional)</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button disabled={loading} onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white">{loading ? 'Submitting...' : 'Submit request'}</button>
        </div>
      </div>
    </div>
  );
};
export default PaymentRequestModal;
