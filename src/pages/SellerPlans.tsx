import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserPlan } from "@/hooks/useUserPlan";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Plan {
  id: string;
  key: string;
  name: string;
  price_rwf: number;
  post_limit_monthly: number;
  updates_limit_monthly: number;
  can_edit_product: boolean;
  description: string | null;
  is_active: boolean;
}

export const SellerPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [phonePaid, setPhonePaid] = useState("+250798751685");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const { plan: currentPlan, activity } = useUserPlan(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_rwf');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load plans",
          variant: "destructive"
        });
        return;
      }

      setPlans(data || []);
    };

    fetchPlans();
  }, [toast]);

  const handleRequestPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowRequestModal(true);
  };

  const submitRequest = async () => {
    if (!userId || !selectedPlan) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .insert({
          user_id: userId,
          requested_plan_id: selectedPlan.id,
          amount_rwf: selectedPlan.price_rwf,
          payment_reference: paymentRef || null,
          phone_paid_to: phonePaid,
          message: message || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your plan request has been submitted for admin approval"
      });

      setShowRequestModal(false);
      setPaymentRef("");
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/seller/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Premium Plans</h1>
        </div>
      </div>
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground mb-6">
          Choose a plan that suits your selling needs. Payment: +250798751685 (Manishimwe Berenard)
        </p>

      {currentPlan && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle>Your Current Plan: {currentPlan.name}</CardTitle>
            <CardDescription>Activity this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Posts</p>
                <p className="text-2xl font-bold">
                  {activity.posts_this_month} / {currentPlan.post_limit_monthly === -1 ? '∞' : currentPlan.post_limit_monthly}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updates</p>
                <p className="text-2xl font-bold">
                  {activity.updates_this_month} / {currentPlan.updates_limit_monthly === -1 ? '∞' : currentPlan.updates_limit_monthly}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Edits</p>
                <p className="text-2xl font-bold">{activity.edits_this_month}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={currentPlan?.key === plan.key ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{plan.name}</CardTitle>
                {currentPlan?.key === plan.key && (
                  <Badge>Current</Badge>
                )}
              </div>
              <CardDescription>
                {plan.price_rwf === 0 ? 'Free' : `${plan.price_rwf.toLocaleString()} RWF / month`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {plan.post_limit_monthly === -1 ? 'Unlimited' : plan.post_limit_monthly} posts/month
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {plan.updates_limit_monthly === -1 ? 'Unlimited' : plan.updates_limit_monthly} updates/month
                  </span>
                </li>
                {plan.can_edit_product && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Edit products</span>
                  </li>
                )}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleRequestPlan(plan)}
                disabled={currentPlan?.key === plan.key}
              >
                {currentPlan?.key === plan.key ? 'Current Plan' : 'Request Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request {selectedPlan?.name} Plan</DialogTitle>
            <DialogDescription>
              Send payment to +250798751685 (Manishimwe Berenard) and provide payment details below.
              Admin will review and approve your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Phone Used for Payment</Label>
              <Input
                value={phonePaid}
                onChange={(e) => setPhonePaid(e.target.value)}
                placeholder="+250..."
              />
            </div>
            <div>
              <Label>Payment Reference (Optional)</Label>
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Transaction ID or reference"
              />
            </div>
            <div>
              <Label>Message (Optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any additional information"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default SellerPlans;
