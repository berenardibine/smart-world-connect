import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/hooks/useLocations";
import { MapPin } from "lucide-react";

interface LocationSelectorProps {
  provinceId?: string;
  districtId?: string;
  sectorId?: string;
  onProvinceChange: (id: string) => void;
  onDistrictChange: (id: string) => void;
  onSectorChange: (id: string) => void;
  showLabel?: boolean;
  compact?: boolean;
  required?: boolean;
}

export function LocationSelector({
  provinceId,
  districtId,
  sectorId,
  onProvinceChange,
  onDistrictChange,
  onSectorChange,
  showLabel = true,
  compact = false,
  required = false,
}: LocationSelectorProps) {
  const { provinces, districts, sectors, loading, fetchDistricts, fetchSectors } = useLocations();
  const [initialized, setInitialized] = useState(false);

  // Load districts when provinceId changes
  useEffect(() => {
    if (provinceId) {
      fetchDistricts(provinceId);
    }
  }, [provinceId]);

  // Load sectors when districtId changes
  useEffect(() => {
    if (districtId) {
      fetchSectors(districtId);
    }
  }, [districtId]);

  // Initialize from existing values
  useEffect(() => {
    if (!initialized && provinceId && districtId) {
      setInitialized(true);
    }
  }, [provinceId, districtId, initialized]);

  const handleProvinceChange = (value: string) => {
    onProvinceChange(value);
    onDistrictChange("");
    onSectorChange("");
  };

  const handleDistrictChange = (value: string) => {
    onDistrictChange(value);
    onSectorChange("");
  };

  if (loading && provinces.length === 0) {
    return <div className="text-sm text-muted-foreground">Loading locations...</div>;
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Select your location</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Select value={provinceId || ""} onValueChange={handleProvinceChange}>
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="Province" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={districtId || ""}
            onValueChange={handleDistrictChange}
            disabled={!provinceId}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sectorId || ""}
            onValueChange={onSectorChange}
            disabled={!districtId}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {sectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {showLabel && (
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Province {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <Select value={provinceId || ""} onValueChange={handleProvinceChange}>
          <SelectTrigger className="h-12 bg-background">
            <SelectValue placeholder="Select Province" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {showLabel && (
          <Label>
            District {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <Select
          value={districtId || ""}
          onValueChange={handleDistrictChange}
          disabled={!provinceId}
        >
          <SelectTrigger className="h-12 bg-background">
            <SelectValue placeholder={provinceId ? "Select District" : "Select Province first"} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {showLabel && (
          <Label>
            Sector {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <Select
          value={sectorId || ""}
          onValueChange={onSectorChange}
          disabled={!districtId}
        >
          <SelectTrigger className="h-12 bg-background">
            <SelectValue placeholder={districtId ? "Select Sector" : "Select District first"} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {sectors.map((sector) => (
              <SelectItem key={sector.id} value={sector.id}>
                {sector.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
