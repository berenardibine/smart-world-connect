import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationFilter } from "@/components/LocationFilter";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Store, MapPin, Phone, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet";

interface Shop {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  contact_phone: string;
  province_id: string;
  district_id: string;
  sector_id: string;
  provinces?: { name: string };
  districts?: { name: string };
  sectors?: { name: string };
  profiles?: { full_name: string; business_name: string };
}

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");

  useEffect(() => {
    loadUserLocation();
  }, []);

  useEffect(() => {
    fetchShops();
  }, [provinceId, districtId, sectorId]);

  const loadUserLocation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("province_id, district_id, sector_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        if (profile.province_id) setProvinceId(profile.province_id);
        if (profile.district_id) setDistrictId(profile.district_id);
        if (profile.sector_id) setSectorId(profile.sector_id);
      }
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shops")
        .select(`
          *,
          provinces:province_id (name),
          districts:district_id (name),
          sectors:sector_id (name),
          profiles:seller_id (full_name, business_name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      let filteredShops = data || [];

      // Apply location-based sorting with priority: sector > district > province
      if (sectorId || districtId || provinceId) {
        const sectorMatches = filteredShops.filter(s => s.sector_id === sectorId);
        const districtMatches = filteredShops.filter(s => s.district_id === districtId && !sectorMatches.includes(s));
        const provinceMatches = filteredShops.filter(s => s.province_id === provinceId && !sectorMatches.includes(s) && !districtMatches.includes(s));
        const otherShops = filteredShops.filter(s => !sectorMatches.includes(s) && !districtMatches.includes(s) && !provinceMatches.includes(s));

        filteredShops = [...sectorMatches, ...districtMatches, ...provinceMatches, ...otherShops];
      }

      setShops(filteredShops);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationApply = (pId: string, dId: string, sId: string) => {
    setProvinceId(pId);
    setDistrictId(dId);
    setSectorId(sId);
  };

  const handleLocationClear = () => {
    setProvinceId("");
    setDistrictId("");
    setSectorId("");
  };

  return (
    <>
      <Helmet>
        <title>Local Shops - Smart Market</title>
        <meta name="description" content="Discover local shops near you on Smart Market" />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <Navbar />

        <main className="pt-20 container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Store className="h-6 w-6 text-primary" />
                Local Shops
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Discover shops near you
              </p>
            </div>
            <LocationFilter
              provinceId={provinceId}
              districtId={districtId}
              sectorId={sectorId}
              onApply={handleLocationApply}
              onClear={handleLocationClear}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-16">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No shops found</h2>
              <p className="text-muted-foreground">
                Try changing your location filter to see more shops
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => (
                <Link key={shop.id} to={`/shop/${shop.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {shop.logo_url ? (
                          <img
                            src={shop.logo_url}
                            alt={shop.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Store className="h-8 w-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {shop.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {shop.description || "Visit our shop for great products"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                          <MapPin className="h-3 w-3" />
                          {shop.sectors?.name || shop.districts?.name || shop.provinces?.name}
                        </span>
                        {shop.contact_phone && (
                          <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                            <Phone className="h-3 w-3" />
                            {shop.contact_phone}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          by {shop.profiles?.business_name || shop.profiles?.full_name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </>
  );
}