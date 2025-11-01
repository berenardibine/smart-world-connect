import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";
import { toast } from "sonner";

interface Update {
  id: string;
  content: string;
  images: string[];
  video_url: string | null;
  created_at: string;
  seller: {
    full_name: string;
    profile_image: string | null;
  };
}

const Updates = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndices, setCurrentImageIndices] = useState<{ [key: string]: number }>({});
  const [fullScreenImage, setFullScreenImage] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  useEffect(() => {
    fetchUpdates();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("updates-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "updates",
        },
        () => {
          fetchUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("updates")
        .select(`
          *,
          seller:profiles!updates_seller_id_fkey(full_name, profile_image)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching updates:", error);
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = (updateId: string, imagesLength: number) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [updateId]: prev[updateId] > 0 ? prev[updateId] - 1 : imagesLength - 1,
    }));
  };

  const handleNextImage = (updateId: string, imagesLength: number) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [updateId]: prev[updateId] < imagesLength - 1 ? prev[updateId] + 1 : 0,
    }));
  };

  const openFullScreen = (images: string[], currentIndex: number) => {
    setFullScreenImage({ images, index: currentIndex });
  };

  const closeFullScreen = () => {
    setFullScreenImage(null);
  };

  const handleFullScreenPrev = () => {
    if (!fullScreenImage) return;
    setFullScreenImage({
      ...fullScreenImage,
      index: fullScreenImage.index > 0 
        ? fullScreenImage.index - 1 
        : fullScreenImage.images.length - 1,
    });
  };

  const handleFullScreenNext = () => {
    if (!fullScreenImage) return;
    setFullScreenImage({
      ...fullScreenImage,
      index: fullScreenImage.index < fullScreenImage.images.length - 1 
        ? fullScreenImage.index + 1 
        : 0,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading updates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Seller Updates</h1>

        {updates.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No updates yet. Check back later!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {updates.map((update) => {
              const currentIndex = currentImageIndices[update.id] || 0;
              const hasMedia = update.images.length > 0 || update.video_url;

              return (
                <Card key={update.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar>
                        <AvatarImage src={update.seller.profile_image || undefined} />
                        <AvatarFallback>
                          {update.seller.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{update.seller.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(update.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <p className="mb-4 whitespace-pre-wrap">{update.content}</p>

                    {hasMedia && (
                      <div className="relative">
                        {update.video_url ? (
                          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                              src={update.video_url}
                              controls
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Play className="h-16 w-16 text-white opacity-70" />
                            </div>
                          </div>
                        ) : update.images.length > 0 ? (
                          <div className="relative">
                            <img
                              src={update.images[currentIndex]}
                              alt={`Update ${currentIndex + 1}`}
                              className="w-full aspect-video object-cover rounded-lg cursor-pointer"
                              onClick={() => openFullScreen(update.images, currentIndex)}
                            />
                            {update.images.length > 1 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                                  onClick={() => handlePrevImage(update.id, update.images.length)}
                                >
                                  <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                                  onClick={() => handleNextImage(update.id, update.images.length)}
                                >
                                  <ChevronRight className="h-6 w-6" />
                                </Button>
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                  {currentIndex + 1} / {update.images.length}
                                </div>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {fullScreenImage && (
        <FullScreenImageViewer
          images={fullScreenImage.images}
          currentIndex={fullScreenImage.index}
          isOpen={true}
          onClose={closeFullScreen}
          onPrevious={handleFullScreenPrev}
          onNext={handleFullScreenNext}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Updates;
