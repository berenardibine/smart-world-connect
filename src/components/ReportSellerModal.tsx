import { useState } from "react";
import { supabase } from "@/lib/supaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ReportSellerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  productId: string;
  sellerName: string;
}

export const ReportSellerModal = ({
  open,
  onOpenChange,
  sellerId,
  productId,
  sellerName,
}: ReportSellerModalProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the report");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to report");
        return;
      }

      const reportMessage = `Report against seller: ${sellerName}\nProduct ID: ${productId}\nReason: ${reason}`;

      const { error } = await supabase.from("admin_messages").insert({
        user_id: session.user.id,
        message: reportMessage,
        is_read: false,
      });

      if (error) throw error;

      toast.success("Report sent successfully!");
      setReason("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Seller</DialogTitle>
          <DialogDescription>
            Report {sellerName} for violating our community guidelines
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for report</Label>
            <Textarea
              id="reason"
              placeholder="Please describe why you are reporting this seller..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Sending..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
