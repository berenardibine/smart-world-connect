import { PostComposer } from "./PostComposer";
import { FeedPost, Post } from "./FeedPost";
import { StoriesCarousel, Story } from "./StoriesCarousel";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for stories
const mockStories: Story[] = [
  { id: "1", user: { id: "1", name: "John Doe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" }, hasNew: true, thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200" },
  { id: "2", user: { id: "2", name: "Jane Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" }, hasNew: true, thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200" },
  { id: "3", user: { id: "3", name: "Mike Wilson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" }, hasNew: true, thumbnail: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=200" },
  { id: "4", user: { id: "4", name: "Sarah Johnson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }, hasNew: false, thumbnail: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200" },
  { id: "5", user: { id: "5", name: "David Lee", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David" }, hasNew: false, thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200" },
  { id: "6", user: { id: "6", name: "Emily Brown", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily" }, hasNew: true },
];

// Mock data for posts
const mockPosts: Post[] = [
  {
    id: "1",
    author: {
      id: "1",
      name: "Smart World Connect",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Smart",
      location: "Kigali, Rwanda",
    },
    content: "🎉 Welcome to Smart World Connect! We're thrilled to have you here. This is your space to connect, share, and explore with the community.\n\n#SmartWorldConnect #Community #Welcome",
    images: ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600"],
    likes: 245,
    comments: 32,
    shares: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: "2",
    author: {
      id: "2",
      name: "Jane Farmer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
      location: "Musanze, Rwanda",
    },
    content: "Just harvested fresh organic vegetables from my farm! 🥬🍅🥕 Available for delivery in Kigali area. DM for orders!\n\n#OrganicFarming #FreshProduce #LocalFood",
    images: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400",
      "https://images.unsplash.com/photo-1592321675774-3de57f3ee0dc?w=400",
    ],
    likes: 89,
    comments: 24,
    shares: 8,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "3",
    author: {
      id: "3",
      name: "Tech Hub Rwanda",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tech",
      location: "Kigali",
    },
    content: "🚀 Exciting news! We're hosting a free coding bootcamp next month. Learn web development, mobile apps, and more!\n\nRegistration opens tomorrow. Tag someone who should apply! 👇\n\n#TechRwanda #CodingBootcamp #LearnToCode",
    likes: 456,
    comments: 78,
    shares: 125,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
];

interface SocialFeedProps {
  isLoading?: boolean;
}

export function SocialFeed({ isLoading = false }: SocialFeedProps) {
  const handlePost = (content: string) => {
    console.log("New post:", content);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stories */}
      <section className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
        <StoriesCarousel
          stories={mockStories}
          onViewStory={(id) => console.log("View story:", id)}
          onAddStory={() => console.log("Add story")}
        />
      </section>

      {/* Post Composer */}
      <PostComposer
        onPost={handlePost}
        userName="User"
      />

      {/* Feed */}
      <div className="space-y-4">
        {mockPosts.map((post) => (
          <FeedPost
            key={post.id}
            post={post}
            onLike={(id) => console.log("Like:", id)}
            onComment={(id) => console.log("Comment:", id)}
            onShare={(id) => console.log("Share:", id)}
            onMessage={(id) => console.log("Message:", id)}
          />
        ))}
      </div>
    </div>
  );
}
