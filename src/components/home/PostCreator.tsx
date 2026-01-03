import { useState, useRef, useEffect } from "react";
import { Image, Video, Smile, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supaseClient";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  full_name: string;
  profile_image: string | null;
}

export function PostCreator({ onPostCreated }: { onPostCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, profile_image")
        .eq("id", session.user.id)
        .maybeSingle();
      
      if (profile) {
        setUser(profile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      toast.error("Please add some content or media");
      return;
    }

    if (!user) {
      toast.error("Please sign in to post");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = null;

      // Upload media if exists
      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const bucket = mediaType === "video" ? "product-videos" : "product-images";
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        
        mediaUrl = urlData.publicUrl;
      }

      // Create post
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: content.trim(),
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (postError) throw postError;

      toast.success("Post created successfully! 🎉");
      setContent("");
      clearMedia();
      setIsOpen(false);
      onPostCreated?.();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Compact Post Bar */}
      <div 
        onClick={() => setIsOpen(true)}
        className="glass-card p-4 cursor-pointer hover:shadow-hover transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={user?.profile_image || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 py-2.5 px-4 rounded-full bg-muted/50 text-muted-foreground text-sm">
            What&apos;s on your mind, {user?.full_name?.split(" ")[0] || "friend"}?
          </div>
        </div>
        
        <div className="flex items-center justify-around mt-3 pt-3 border-t border-border/50">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-primary/5">
            <Image className="h-5 w-5 text-success" />
            <span className="hidden sm:inline">Photo</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-primary/5">
            <Video className="h-5 w-5 text-destructive" />
            <span className="hidden sm:inline">Video</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-primary/5">
            <Smile className="h-5 w-5 text-warning" />
            <span className="hidden sm:inline">Feeling</span>
          </button>
        </div>
      </div>

      {/* Full Post Editor Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center">Create Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.profile_image || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">Sharing with everyone</p>
              </div>
            </div>

            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
            />

            {/* Media Preview */}
            {mediaPreview && (
              <div className="relative rounded-xl overflow-hidden">
                <button
                  onClick={clearMedia}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {mediaType === "video" ? (
                  <video
                    src={mediaPreview}
                    className="w-full max-h-64 object-cover rounded-xl"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-xl"
                  />
                )}
              </div>
            )}

            {/* Media Actions */}
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border">
              <span className="text-sm font-medium text-muted-foreground flex-1">
                Add to your post
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "image")}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "video")}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-success/10 transition-colors"
              >
                <Image className="h-6 w-6 text-success" />
              </button>
              <button 
                onClick={() => videoInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
              >
                <Video className="h-6 w-6 text-destructive" />
              </button>
              <button className="p-2 rounded-full hover:bg-warning/10 transition-colors">
                <Smile className="h-6 w-6 text-warning" />
              </button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !mediaFile)}
              className="w-full btn-gradient h-12 text-base font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
