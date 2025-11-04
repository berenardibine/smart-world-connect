import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, Eye, Building2, Mail, ExternalLink, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  title: string;
  company_name: string;
  location: string;
  salary: string | null;
  job_type: string;
  description: string;
  requirements: string | null;
  contact_email: string | null;
  apply_link: string | null;
  images: string[];
  video_url: string | null;
  views: number;
  created_at: string;
}

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOpportunity();
      incrementViews();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOpportunity(data);
    } catch (error: any) {
      toast.error("Failed to load opportunity details");
      navigate('/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      await supabase.rpc('increment_opportunity_view', { opportunity_uuid: id });
    } catch (error) {
      console.error('Failed to increment views:', error);
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
          <div className="text-center">Loading...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!opportunity) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/opportunities')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Opportunities
        </Button>

        <Card>
          <CardContent className="p-6">
            {/* Images */}
            {opportunity.images && opportunity.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {opportunity.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${opportunity.title} ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Video */}
            {opportunity.video_url && (
              <div className="mb-6">
                <video controls className="w-full rounded-lg">
                  <source src={opportunity.video_url} />
                </video>
              </div>
            )}

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{opportunity.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="h-5 w-5" />
                    <span className="text-lg">{opportunity.company_name}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {formatJobType(opportunity.job_type)}
                </Badge>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{opportunity.location}</span>
                </div>
                {opportunity.salary && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-5 w-5" />
                    <span>{opportunity.salary}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-5 w-5" />
                  <span>{opportunity.views} views</span>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Job Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {opportunity.description}
                </p>
              </div>

              {/* Requirements */}
              {opportunity.requirements && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Requirements</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {opportunity.requirements}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Application Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">How to Apply</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  {opportunity.contact_email && (
                    <Button
                      onClick={() => window.location.href = `mailto:${opportunity.contact_email}`}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email Application
                    </Button>
                  )}
                  {opportunity.apply_link && (
                    <Button
                      onClick={() => window.open(opportunity.apply_link!, '_blank')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Apply Online
                    </Button>
                  )}
                  {!opportunity.contact_email && !opportunity.apply_link && (
                    <p className="text-muted-foreground">
                      Contact the company directly for application details.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default OpportunityDetail;