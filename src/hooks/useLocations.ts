import { useState, useEffect } from "react";
import { supabase } from "@/lib/supaseClient";

export interface Province {
  id: string;
  name: string;
}

export interface District {
  id: string;
  province_id: string;
  name: string;
}

export interface Sector {
  id: string;
  district_id: string;
  name: string;
}

export function useLocations() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    const { data } = await supabase
      .from("provinces")
      .select("*")
      .order("name");
    
    setProvinces(data || []);
    setLoading(false);
  };

  const fetchDistricts = async (provinceId: string) => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    
    const { data } = await supabase
      .from("districts")
      .select("*")
      .eq("province_id", provinceId)
      .order("name");
    
    setDistricts(data || []);
    setSectors([]); // Reset sectors when province changes
  };

  const fetchSectors = async (districtId: string) => {
    if (!districtId) {
      setSectors([]);
      return;
    }
    
    const { data } = await supabase
      .from("sectors")
      .select("*")
      .eq("district_id", districtId)
      .order("name");
    
    setSectors(data || []);
  };

  return {
    provinces,
    districts,
    sectors,
    loading,
    fetchDistricts,
    fetchSectors,
  };
}

export function useLocationNames(provinceId?: string, districtId?: string, sectorId?: string) {
  const [names, setNames] = useState<{
    province?: string;
    district?: string;
    sector?: string;
  }>({});

  useEffect(() => {
    const fetchNames = async () => {
      const newNames: typeof names = {};

      if (provinceId) {
        const { data } = await supabase
          .from("provinces")
          .select("name")
          .eq("id", provinceId)
          .maybeSingle();
        newNames.province = data?.name;
      }

      if (districtId) {
        const { data } = await supabase
          .from("districts")
          .select("name")
          .eq("id", districtId)
          .maybeSingle();
        newNames.district = data?.name;
      }

      if (sectorId) {
        const { data } = await supabase
          .from("sectors")
          .select("name")
          .eq("id", sectorId)
          .maybeSingle();
        newNames.sector = data?.name;
      }

      setNames(newNames);
    };

    fetchNames();
  }, [provinceId, districtId, sectorId]);

  return names;
}
