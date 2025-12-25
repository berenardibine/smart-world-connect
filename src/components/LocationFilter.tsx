import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LocationSelector } from "@/components/LocationSelector";
import { MapPin, X } from "lucide-react";
import { useLocationNames } from "@/hooks/useLocations";

interface LocationFilterProps {
  provinceId?: string;
  districtId?: string;
  sectorId?: string;
  onApply: (provinceId: string, districtId: string, sectorId: string) => void;
  onClear: () => void;
}

export function LocationFilter({
  provinceId,
  districtId,
  sectorId,
  onApply,
  onClear,
}: LocationFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempProvinceId, setTempProvinceId] = useState(provinceId || "");
  const [tempDistrictId, setTempDistrictId] = useState(districtId || "");
  const [tempSectorId, setTempSectorId] = useState(sectorId || "");
  
  const locationNames = useLocationNames(provinceId, districtId, sectorId);

  const handleApply = () => {
    onApply(tempProvinceId, tempDistrictId, tempSectorId);
    setOpen(false);
  };

  const handleClear = () => {
    setTempProvinceId("");
    setTempDistrictId("");
    setTempSectorId("");
    onClear();
    setOpen(false);
  };

  const hasFilter = provinceId || districtId || sectorId;

  const getFilterLabel = () => {
    if (locationNames.sector) return locationNames.sector;
    if (locationNames.district) return locationNames.district;
    if (locationNames.province) return locationNames.province;
    return "All Locations";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant={hasFilter ? "default" : "outline"}
          size="sm"
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{getFilterLabel()}</span>
          <span className="sm:hidden">Location</span>
          {hasFilter && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Filter by Location
          </SheetTitle>
          <SheetDescription>
            Select your preferred location to see nearby products and sellers
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <LocationSelector
            provinceId={tempProvinceId}
            districtId={tempDistrictId}
            sectorId={tempSectorId}
            onProvinceChange={setTempProvinceId}
            onDistrictChange={setTempDistrictId}
            onSectorChange={setTempSectorId}
          />
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Clear Filter
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
