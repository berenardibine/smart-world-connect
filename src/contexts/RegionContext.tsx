import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supaseClient";

interface Location {
  id: string;
  name: string;
  slug: string;
  type: "country" | "province" | "district" | "sector";
  parent_id: string | null;
}

interface RegionContextType {
  currentLocation: Location | null;
  locationHierarchy: Location[];
  isLoading: boolean;
  setLocation: (locationId: string | null) => Promise<void>;
  setLocationBySlug: (type: string, slug: string) => Promise<void>;
  clearLocation: () => void;
  getLocationPath: () => string;
  getLocationTitle: () => string;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
  userProfile: any | null;
  refreshUserLocation: () => Promise<void>;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationHierarchy, setLocationHierarchy] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // Load initial location from localStorage or user profile
  useEffect(() => {
    loadInitialLocation();
  }, []);

  const loadInitialLocation = async () => {
    setIsLoading(true);
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Load from user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("sector_id, district_id, province_id")
          .eq("id", session.user.id)
          .maybeSingle();
        
        setUserProfile(profile);
        
        if (profile?.sector_id) {
          await setLocation(profile.sector_id);
        } else if (profile?.district_id) {
          await setLocation(profile.district_id);
        } else if (profile?.province_id) {
          await setLocation(profile.province_id);
        } else {
          // No location set, show modal for first-time users
          setShowLocationModal(true);
        }
      } else {
        // Check localStorage for anonymous users
        const savedLocationId = localStorage.getItem("swc_location_id");
        if (savedLocationId) {
          await setLocation(savedLocationId);
        } else {
          // No saved location, show modal
          setShowLocationModal(true);
        }
      }
    } catch (error) {
      console.error("Error loading initial location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLocation = useCallback(async (locationId: string | null) => {
    if (!locationId) {
      setCurrentLocation(null);
      setLocationHierarchy([]);
      localStorage.removeItem("swc_location_id");
      return;
    }

    try {
      // Fetch the location
      const { data: location } = await supabase
        .from("locations")
        .select("*")
        .eq("id", locationId)
        .maybeSingle();

      if (location) {
        setCurrentLocation({
          ...location,
          type: location.type as "country" | "province" | "district" | "sector"
        });
        localStorage.setItem("swc_location_id", locationId);
        
        // Fetch hierarchy
        const { data: hierarchy } = await supabase.rpc("get_location_hierarchy", {
          location_uuid: locationId
        });
        if (hierarchy) {
          // Convert to Location objects and sort from country to sector
          const hierarchyLocations = hierarchy.map((h: any) => ({
            id: h.location_id,
            name: h.location_name,
            type: h.location_type,
            slug: h.location_slug,
            parent_id: null
          }));
          
          // Sort by type order
          const typeOrder = { country: 0, province: 1, district: 2, sector: 3 };
          hierarchyLocations.sort((a: Location, b: Location) => 
            typeOrder[a.type] - typeOrder[b.type]
          );
          
          setLocationHierarchy(hierarchyLocations);
        }
      }
    } catch (error) {
      console.error("Error setting location:", error);
    }
  }, []);

  const setLocationBySlug = useCallback(async (type: string, slug: string) => {
    try {
      const { data: location } = await supabase
        .from("locations")
        .select("*")
        .eq("type", type)
        .eq("slug", slug)
        .maybeSingle();

      if (location) {
        await setLocation(location.id);
      }
    } catch (error) {
      console.error("Error setting location by slug:", error);
    }
  }, [setLocation]);

  const clearLocation = useCallback(() => {
    setCurrentLocation(null);
    setLocationHierarchy([]);
    localStorage.removeItem("swc_location_id");
  }, []);

  const getLocationPath = useCallback(() => {
    if (!currentLocation) return "";
    return `/region/${currentLocation.type}/${currentLocation.slug}`;
  }, [currentLocation]);

  const getLocationTitle = useCallback(() => {
    if (!currentLocation) return "Smart World Connect";
    const typeLabel = currentLocation.type.charAt(0).toUpperCase() + currentLocation.type.slice(1);
    return `Smart World Connect – ${typeLabel} ${currentLocation.name}`;
  }, [currentLocation]);

  const refreshUserLocation = useCallback(async () => {
    await loadInitialLocation();
  }, []);

  return (
    <RegionContext.Provider
      value={{
        currentLocation,
        locationHierarchy,
        isLoading,
        setLocation,
        setLocationBySlug,
        clearLocation,
        getLocationPath,
        getLocationTitle,
        showLocationModal,
        setShowLocationModal,
        userProfile,
        refreshUserLocation
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
}
