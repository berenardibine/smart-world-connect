import { useRegion } from "@/contexts/RegionContext";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight, Globe } from "lucide-react";

export function RegionalHeader() {
  const { currentLocation, locationHierarchy, setShowLocationModal, isLoading } = useRegion();

  if (isLoading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Smart World Connect
              {currentLocation && (
                <>
                  <span className="text-primary">–</span>
                  <span className="text-primary capitalize">
                    {currentLocation.type} {currentLocation.name}
                  </span>
                </>
              )}
            </h1>
            {currentLocation && (
              <p className="text-sm text-muted-foreground mt-1">
                Buy, sell and connect with your local community in {currentLocation.name}
              </p>
            )}
            {!currentLocation && (
              <p className="text-sm text-muted-foreground mt-1">
                Select your location to see products and shops near you
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 w-fit"
          >
            <MapPin className="h-4 w-4" />
            {currentLocation ? "Change Location" : "Select Location"}
          </Button>
        </div>

        {/* Location Breadcrumb */}
        {locationHierarchy.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground overflow-x-auto scrollbar-hide">
            {locationHierarchy.map((loc, index) => (
              <span key={loc.id} className="flex items-center gap-1 whitespace-nowrap">
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={index === locationHierarchy.length - 1 ? "text-primary font-medium" : ""}>
                  {loc.name}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
