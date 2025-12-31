import { useState, useRef } from "react";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Loader2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VideoUploadButtonProps {
  onUploadComplete?: () => void;
  compact?: boolean;
}

export function VideoUploadButton({ onUploadComplete, compact = false }: VideoUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 100MB",
        variant: "destructive",
      });
      return;
    }

    setVideoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please select a video to upload",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login required",
        description: "Please login to upload videos",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload video to storage
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-videos")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("product-videos")
        .getPublicUrl(uploadData.path);

      // Create video record
      const { error: insertError } = await supabase.from("videos").insert({
        user_id: session.user.id,
        title: title || null,
        description: description || null,
        video_url: publicUrl,
      });

      if (insertError) throw insertError;

      toast({
        title: "Video uploaded!",
        description: "Your video has been published",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setPreviewUrl(null);
      setOpen(false);
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button size="icon" className="rounded-full shadow-lg">
            <Plus className="h-5 w-5" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Video className="h-4 w-4" />
            Upload Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Short Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video preview/upload area */}
          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl cursor-pointer transition-colors",
              "flex flex-col items-center justify-center",
              previewUrl ? "border-primary" : "border-border hover:border-primary/50",
              "aspect-[9/16] max-h-[300px] overflow-hidden"
            )}
          >
            {previewUrl ? (
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <div className="text-center p-6">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to select a video
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP4, WebM, MOV (max 100MB)
                </p>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Add a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Tell viewers about this video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={!videoFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
