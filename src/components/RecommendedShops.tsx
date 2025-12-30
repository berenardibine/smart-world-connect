import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { useRegion } from "@/contexts/RegionContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, MapPin, ArrowRight, Star } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  market_center: string;
  province_id: string;
  district_id: string;
  sector_id: string;
  provinces?: { name: string };
  districts?: { name: string };
  sectors?: { name: string };
  profiles?: { 
    full_name: string; 
    business_name: string;
    rating: number;
  };
}

export function RecommendedShops() {
  const { currentLocation, userProfile } = useRegion();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegionalShops();
  }, [currentLocation, userProfile]);

  const fetchRegionalShops = async () => {
    setLoading(true);
    try {
      const { data: allShops, error } = await supabase
        .from("shops")
        .select(`
          *,
          provinces:province_id (name),
          districts:district_id (name),
          sectors:sector_id (name),
          profiles:seller_id (full_name, business_name, rating)
        `)
        .eq("is_active", true)
        .limit(20);

      if (error) throw error;

      // Get location IDs for filtering
      const sectorId = userProfile?.sector_id || currentLocation?.id;
      const districtId = userProfile?.district_id;
      const provinceId = userProfile?.province_id;

      if (allShops) {
        // Prioritize shops by location proximity
        const sectorMatches = allShops.filter(s => s.sector_id === sectorId);
        const districtMatches = allShops.filter(s => s.district_id === districtId && !sectorMatches.includes(s));
        const provinceMatches = allShops.filter(s => s.province_id === provinceId && !sectorMatches.includes(s) && !districtMatches.includes(s));
        const otherShops = allShops.filter(s => !sectorMatches.includes(s) && !districtMatches.includes(s) && !provinceMatches.includes(s));

        const sortedShops = [...sectorMatches, ...districtMatches, ...provinceMatches, ...otherShops];
        setShops(sortedShops.slice(0, 6));
      }
    } catch (error) {
      console.error("Error fetching regional shops:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Recommended Shops</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Recommended Shops</h2>
          {currentLocation && (
            <span className="text-xs text-muted-foreground">
              near {currentLocation.name}
            </span>
          )}
        </div>
        <Link to="/shops" className="text-sm text-primary hover:underline flex items-center gap-1">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {shops.map((shop) => (
          <Link key={shop.id} to={`/shop/${shop.id}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {shop.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {shop.sectors?.name || shop.districts?.name || shop.provinces?.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                {shop.market_center && (
                  <div className="mt-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full inline-block">
                    📍 {shop.market_center}
                  </div>
                )}

                {shop.profiles?.rating && shop.profiles.rating > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    <span>{shop.profiles.rating.toFixed(1)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
