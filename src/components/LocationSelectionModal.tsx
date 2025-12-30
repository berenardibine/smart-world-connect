import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supaseClient";
import { useRegion } from "@/contexts/RegionContext";

interface Location {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
}

export function LocationSelectionModal() {
  const { showLocationModal, setShowLocationModal, setLocation } = useRegion();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<Location[]>([]);
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Location[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("");

  useEffect(() => {
    if (showLocationModal) {
      fetchCountries();
    }
  }, [showLocationModal]);

  const fetchCountries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("type", "country")
      .order("name");
    
    setCountries(data || []);
    
    // Auto-select Rwanda if it exists
    const rwanda = data?.find(c => c.name === "Rwanda");
    if (rwanda) {
      setSelectedCountry(rwanda.id);
      fetchProvinces(rwanda.id);
    }
    
    setLoading(false);
  };

  const fetchProvinces = async (countryId: string) => {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("type", "province")
      .eq("parent_id", countryId)
      .order("name");
    
    setProvinces(data || []);
    setDistricts([]);
    setSectors([]);
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedSector("");
  };

  const fetchDistricts = async (provinceId: string) => {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("type", "district")
      .eq("parent_id", provinceId)
      .order("name");
    
    setDistricts(data || []);
    setSectors([]);
    setSelectedDistrict("");
    setSelectedSector("");
  };

  const fetchSectors = async (districtId: string) => {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("type", "sector")
      .eq("parent_id", districtId)
      .order("name");
    
    setSectors(data || []);
    setSelectedSector("");
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    fetchProvinces(value);
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    fetchDistricts(value);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    fetchSectors(value);
  };

  const handleSectorChange = (value: string) => {
    setSelectedSector(value);
  };

  const handleConfirm = async () => {
    setSaving(true);
    
    // Priority: sector > district > province > country
    const locationId = selectedSector || selectedDistrict || selectedProvince || selectedCountry;
    
    if (locationId) {
      await setLocation(locationId);
      
      // Save to user profile if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from("profiles")
          .update({
            province_id: selectedProvince || null,
            district_id: selectedDistrict || null,
            sector_id: selectedSector || null
          })
          .eq("id", session.user.id);
      }
    }
    
    setSaving(false);
    setShowLocationModal(false);
  };

  const handleSkip = () => {
    localStorage.setItem("swc_location_skipped", "true");
    setShowLocationModal(false);
  };

  return (
    <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            Select Your Location
          </DialogTitle>
          <DialogDescription>
            Choose your location to see products and shops near you
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Country */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Country
              </label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Province */}
            {provinces.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Province</label>
                <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* District */}
            {districts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">District</label>
                <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sector */}
            {sectors.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sector</label>
                <Select value={selectedSector} onValueChange={handleSectorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleSkip} className="flex-1">
                Skip for now
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={!selectedCountry || saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Confirm Location"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
