import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Check, X, Eye, ArrowLeft } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  status: string;
  created_at: string;
  seller_id: string;
}

const AdminOpportunities = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await fetchOpportunities();
    setLoading(false);
  };

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error: any) {
      toast.error("Failed to load opportunities");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Opportunity ${status}`);
      fetchOpportunities();
    } catch (error: any) {
      toast.error("Failed to update opportunity status");
    }
  };

  const deleteOpportunity = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;

    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Opportunity deleted successfully");
      fetchOpportunities();
    } catch (error: any) {
      toast.error("Failed to delete opportunity");
    }
  };

  const formatJobType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Opportunity Management</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardDescription>Review and manage job opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opportunity) => (
                  <TableRow key={opportunity.id}>
                    <TableCell className="font-medium">{opportunity.title}</TableCell>
                    <TableCell>{opportunity.company_name}</TableCell>
                    <TableCell>{opportunity.location}</TableCell>
                    <TableCell>{formatJobType(opportunity.job_type)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          opportunity.status === "approved"
                            ? "default"
                            : opportunity.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {opportunity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/opportunities/${opportunity.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {opportunity.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatus(opportunity.id, "approved")}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {opportunity.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatus(opportunity.id, "rejected")}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteOpportunity(opportunity.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {opportunities.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No opportunities found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOpportunities;