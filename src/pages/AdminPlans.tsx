import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface SubscriptionRequest {
  id: string;
  user_id: string;
  requested_plan_id: string;
  amount_rwf: number;
  payment_reference: string | null;
  phone_paid_to: string | null;
  message: string | null;
  status: string;
  created_at: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
  plan_name?: string;
}

export const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
    fetchRequests();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
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

  const fetchRequests = async () => {
    const { data: requestsData, error } = await supabase
      .from('subscription_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive"
      });
      return;
    }

    // Fetch user profiles and plan names
    const enrichedRequests = await Promise.all(
      (requestsData || []).map(async (request) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', request.user_id)
          .single();

        const { data: plan } = await supabase
          .from('plans')
          .select('name')
          .eq('id', request.requested_plan_id)
          .single();

        return {
          ...request,
          user_profile: profile,
          plan_name: plan?.name
        };
      })
    );

    setRequests(enrichedRequests);
  };

  const handleUpdatePlan = async (plan: Plan) => {
    const { error } = await supabase
      .from('plans')
      .update({
        name: plan.name,
        price_rwf: plan.price_rwf,
        post_limit_monthly: plan.post_limit_monthly,
        updates_limit_monthly: plan.updates_limit_monthly,
        can_edit_product: plan.can_edit_product,
        description: plan.description,
        is_active: plan.is_active
      })
      .eq('id', plan.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Plan updated successfully"
    });
    
    fetchPlans();
    setEditMode(false);
    setSelectedPlan(null);
  };

  const handleApproveRequest = async (request: SubscriptionRequest) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update request status
    const { error: reqError } = await supabase
      .from('subscription_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', request.id);

    if (reqError) {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
      return;
    }

    // Create or update subscription
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: request.user_id,
        plan_id: request.requested_plan_id,
        status: 'active',
        started_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (subError) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Request approved and subscription activated"
    });

    fetchRequests();
  };

  const handleRejectRequest = async (requestId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('subscription_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Request rejected"
    });

    fetchRequests();
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Plan Management</h1>
        </div>
      </div>
      <div className="container mx-auto p-6">

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>
                        {plan.price_rwf === 0 ? 'Free' : `${plan.price_rwf.toLocaleString()} RWF / month`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editMode && selectedPlan?.id === plan.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={selectedPlan.name}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Price (RWF)</Label>
                        <Input
                          type="number"
                          value={selectedPlan.price_rwf}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, price_rwf: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Post Limit (-1 for unlimited)</Label>
                        <Input
                          type="number"
                          value={selectedPlan.post_limit_monthly}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, post_limit_monthly: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Updates Limit (-1 for unlimited)</Label>
                        <Input
                          type="number"
                          value={selectedPlan.updates_limit_monthly}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, updates_limit_monthly: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={selectedPlan.description || ''}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={selectedPlan.can_edit_product}
                          onCheckedChange={(checked) => setSelectedPlan({ ...selectedPlan, can_edit_product: checked })}
                        />
                        <Label>Can Edit Products</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={selectedPlan.is_active}
                          onCheckedChange={(checked) => setSelectedPlan({ ...selectedPlan, is_active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdatePlan(selectedPlan)}>Save</Button>
                        <Button variant="outline" onClick={() => { setEditMode(false); setSelectedPlan(null); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm mb-4">{plan.description}</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Posts/month</p>
                          <p className="font-bold">{plan.post_limit_monthly === -1 ? 'Unlimited' : plan.post_limit_monthly}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Updates/month</p>
                          <p className="font-bold">{plan.updates_limit_monthly === -1 ? 'Unlimited' : plan.updates_limit_monthly}</p>
                        </div>
                      </div>
                      <Button onClick={() => { setEditMode(true); setSelectedPlan(plan); }}>
                        Edit Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Requests</CardTitle>
              <CardDescription>Review and approve/reject subscription requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.user_profile?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{request.user_profile?.email || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{request.plan_name || 'Unknown'}</TableCell>
                      <TableCell>{request.amount_rwf.toLocaleString()} RWF</TableCell>
                      <TableCell>{request.phone_paid_to}</TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === 'approved' ? 'default' : 
                          request.status === 'rejected' ? 'destructive' : 
                          'secondary'
                        }>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApproveRequest(request)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(request.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default AdminPlans;
