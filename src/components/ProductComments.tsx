import { useState, useEffect } from "react";
import { supabase } from "@/lib/supaseClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  comment: string;
  rating: number | null;
  created_at: string;
  user_id: string;
  user_profile?: {
    full_name: string;
    profile_image: string | null;
  };
}

interface ProductCommentsProps {
  productId: string;
  sellerId: string;
}

export const ProductComments = ({ productId, sellerId }: ProductCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchComments();
    checkUser();
  }, [productId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setCurrentUser(data);
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        user_profile:user_id (
          full_name,
          profile_image
        )
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComments(data.map(c => ({
        ...c,
        user_profile: Array.isArray(c.user_profile) ? c.user_profile[0] : c.user_profile
      })));
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (currentUser.id === sellerId) {
      toast.error("You cannot comment on your own product");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("comments").insert({
        product_id: productId,
        seller_id: sellerId,
        user_id: currentUser.id,
        comment: newComment.trim(),
        rating: newRating > 0 ? newRating : null,
      });

      if (error) throw error;

      setNewComment("");
      setNewRating(0);
      fetchComments();
      toast.success("Comment posted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onSelect?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Reviews & Comments</h3>

      {/* Comment Form */}
      {currentUser && currentUser.id !== sellerId && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Your Rating</label>
            {renderStars(newRating, true, setNewRating)}
          </div>
          <Textarea
            placeholder="Write your review..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No reviews yet. Be the first to review!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 border rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user_profile?.profile_image || ""} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{comment.user_profile?.full_name || "User"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                {comment.rating && <div className="mb-2">{renderStars(comment.rating)}</div>}
                <p className="text-sm">{comment.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
