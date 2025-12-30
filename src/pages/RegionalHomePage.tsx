import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRegion } from "@/contexts/RegionContext";
import Home from "./Home";

export default function RegionalHomePage() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const { setLocationBySlug } = useRegion();

  useEffect(() => {
    if (type && slug) {
      setLocationBySlug(type, slug);
    }
  }, [type, slug, setLocationBySlug]);

  return <Home />;
}