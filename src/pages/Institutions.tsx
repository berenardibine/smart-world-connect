import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supaseClient";
import { 
  Building2, Search, Globe, Mail, CheckCircle2, 
  MapPin, ExternalLink, Users
} from "lucide-react";

interface Institution {
  id: string;
  name: string;
  logo_url: string;
  country: string;
  description: string;
  focus_areas: string[];
  is_verified: boolean;
  contact_email: string;
  website: string;
  created_at: string;
}

export default function Institutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('is_verified', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching institutions:', error);
    } else {
      setInstitutions(data || []);
    }
    setLoading(false);
  };

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.focus_areas?.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-orange-500 to-red-500 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Building2 className="h-8 w-8 text-white" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Institutions</h1>
          </div>
          <p className="text-white/90 mb-4">
            Partner universities, research centers, and organizations
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search institutions, countries, or focus areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Institutions Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1,2,3,4].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-muted rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No institutions found</h3>
            <p className="text-muted-foreground">
              Check back later for partner organizations.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredInstitutions.map(institution => (
              <Card key={institution.id} className="p-5 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {institution.logo_url ? (
                      <img 
                        src={institution.logo_url} 
                        alt={institution.name}
                        className="h-16 w-16 object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {institution.name}
                      </h3>
                      {institution.is_verified && (
                        <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                      )}
                    </div>
                    
                    {institution.country && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {institution.country}
                      </div>
                    )}
                  </div>
                </div>
                
                {institution.description && (
                  <p className="text-muted-foreground text-sm mt-4 line-clamp-2">
                    {institution.description}
                  </p>
                )}
                
                {institution.focus_areas && institution.focus_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {institution.focus_areas.slice(0, 4).map((area, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                    {institution.focus_areas.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{institution.focus_areas.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  {institution.website && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1"
                      onClick={() => window.open(institution.website, '_blank')}
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </Button>
                  )}
                  {institution.contact_email && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1"
                      onClick={() => window.open(`mailto:${institution.contact_email}`, '_blank')}
                    >
                      <Mail className="h-3 w-3" />
                      Contact
                    </Button>
                  )}
                  <Button size="sm" className="rounded-full gap-1 ml-auto">
                    <Users className="h-3 w-3" />
                    Collaborate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
