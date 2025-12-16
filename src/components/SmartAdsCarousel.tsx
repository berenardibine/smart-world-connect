import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supaseClient";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ad {
  id: string;
  type: 'image' | 'text';
  title: string;
  description: string | null;
  image_url: string | null;
  bg_color: string | null;
  text_color: string | null;
  font_size: string | null;
  link: string | null;
}

export function SmartAdsCarousel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", new Date().toISOString())
      .gt("end_date", new Date().toISOString())
      .order("priority", { ascending: false });

    if (!error && data) {
      setAds(data as Ad[]);
    }
  };

  const handleAdClick = (ad: Ad) => {
    if (ad.link) {
      window.open(ad.link, '_blank');
    }
  };

  const getFontSize = (size: string | null) => {
    switch (size) {
      case 'small': return 'text-sm';
      case 'large': return 'text-xl';
      default: return 'text-base';
    }
  };

  if (ads.length === 0) return null;

  return (
    <div className="relative mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Sponsored</span>
      </div>
      
      <div className="relative overflow-hidden rounded-xl">
        <div 
          ref={scrollRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="w-full flex-shrink-0 cursor-pointer"
              onClick={() => handleAdClick(ad)}
            >
              {ad.type === 'image' && ad.image_url ? (
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-32 md:h-48 object-cover rounded-xl"
                />
              ) : (
                <div
                  className={`w-full h-32 md:h-48 rounded-xl flex flex-col items-center justify-center p-4 ${getFontSize(ad.font_size)}`}
                  style={{
                    backgroundColor: ad.bg_color || '#f97316',
                    color: ad.text_color || '#ffffff'
                  }}
                >
                  <h3 className="font-bold text-center">{ad.title}</h3>
                  {ad.description && (
                    <p className="text-center mt-2 opacity-90">{ad.description}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {ads.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev + 1) % ads.length);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {ads.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {ads.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
