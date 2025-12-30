import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { useRegion } from "@/contexts/RegionContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, TrendingUp, MapPin } from "lucide-react";

interface Seller {
  id: string;
  full_name: string;
  business_name: string | null;
  profile_image: string | null;
  rating: number;
  rating_count: number;
  province_id: string;
  district_id: string;
  sector_id: string;
  provinces?: { name: string };
  districts?: { name: string };
  sectors?: { name: string };
}

export function TopRatedSellers() {
  const { currentLocation, userProfile } = useRegion();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopSellers();
  }, [currentLocation, userProfile]);

  const fetchTopSellers = async () => {
    setLoading(true);
    try {
      const { data: allSellers, error } = await supabase
        .from("profiles")
        .select(`
          id, full_name, business_name, profile_image, rating, rating_count,
          province_id, district_id, sector_id,
          provinces:province_id (name),
          districts:district_id (name),
          sectors:sector_id (name)
        `)
        .eq("user_type", "seller")
        .gt("rating", 0)
        .order("rating", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get location IDs for filtering
      const sectorId = userProfile?.sector_id;
      const districtId = userProfile?.district_id;
      const provinceId = userProfile?.province_id;

      if (allSellers) {
        // Prioritize by location, then by rating
        const sectorMatches = allSellers.filter(s => s.sector_id === sectorId);
        const districtMatches = allSellers.filter(s => s.district_id === districtId && !sectorMatches.includes(s));
        const provinceMatches = allSellers.filter(s => s.province_id === provinceId && !sectorMatches.includes(s) && !districtMatches.includes(s));
        const otherSellers = allSellers.filter(s => !sectorMatches.includes(s) && !districtMatches.includes(s) && !provinceMatches.includes(s));

        const sortedSellers = [...sectorMatches, ...districtMatches, ...provinceMatches, ...otherSellers];
        setSellers(sortedSellers.slice(0, 6));
      }
    } catch (error) {
      console.error("Error fetching top sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Top Rated Sellers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (sellers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Top Rated Sellers</h2>
        {currentLocation && (
          <span className="text-xs text-muted-foreground">
            in {currentLocation.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sellers.map((seller) => (
          <Link key={seller.id} to={`/seller/${seller.id}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={seller.profile_image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(seller.business_name || seller.full_name || "S").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {seller.business_name || seller.full_name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span className="font-medium">{seller.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-muted-foreground">
                        ({seller.rating_count || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {seller.sectors?.name || seller.districts?.name || seller.provinces?.name || "Rwanda"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
