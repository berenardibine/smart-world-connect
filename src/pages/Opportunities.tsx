import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Eye, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  title: string;
  company_name: string;
  location: string;
  salary: string | null;
  job_type: string;
  description: string;
  images: string[];
  views: number;
  created_at: string;
}

const Opportunities = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error: any) {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  const formatJobType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading opportunities...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Job Opportunities</h1>
          <p className="text-muted-foreground">Browse available job opportunities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <Card
              key={opportunity.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/opportunities/${opportunity.id}`)}
            >
              {opportunity.images && opportunity.images.length > 0 && (
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={opportunity.images[0]}
                    alt={opportunity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                  <Badge variant="secondary">{formatJobType(opportunity.job_type)}</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {opportunity.company_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {opportunity.location}
                  </div>
                  {opportunity.salary && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {opportunity.salary}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Eye className="h-4 w-4 mr-2" />
                    {opportunity.views} views
                  </div>
                  <p className="text-sm line-clamp-2 mt-2">{opportunity.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {opportunities.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No opportunities available yet</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Opportunities;