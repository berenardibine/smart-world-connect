import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Eye, Building2, Megaphone, ExternalLink } from "lucide-react";
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

interface MarketingPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  link_url: string | null;
  link_text: string;
  post_type: string;
  views: number;
  created_at: string;
}

const Opportunities = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch opportunities
      const { data: oppsData, error: oppsError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (oppsError) throw oppsError;
      setOpportunities(oppsData || []);

      // Fetch marketing posts
      const { data: marketingData, error: marketingError } = await supabase
        .from('marketing_posts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!marketingError && marketingData) {
        setMarketingPosts(marketingData);
      }
    } catch (error: any) {
      toast.error("Failed to load content");
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
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center">Loading...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Opportunities & Updates</h1>
          <p className="text-muted-foreground">Browse job opportunities and announcements</p>
        </div>

        {/* Marketing Posts Section */}
        {marketingPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Announcements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketingPosts.map((post) => (
                <Card key={post.id} className="border-primary/20 bg-primary/5">
                  {post.images && post.images.length > 0 && (
                    <div className="h-40 overflow-hidden rounded-t-lg">
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <Badge variant="default">{post.post_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                    {post.link_url && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => window.open(post.link_url!, '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {post.link_text || 'Learn More'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Job Opportunities Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Opportunities
          </h2>
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
              <p className="text-lg text-muted-foreground">No job opportunities available yet</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Opportunities;