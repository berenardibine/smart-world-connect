import { useState, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Story {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  thumbnail?: string;
  hasNew?: boolean;
  isOwn?: boolean;
}

interface StoriesCarouselProps {
  stories: Story[];
  onViewStory?: (storyId: string) => void;
  onAddStory?: () => void;
}

export function StoriesCarousel({ stories, onViewStory, onAddStory }: StoriesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative">
      {/* Left Arrow */}
      {showLeftArrow && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full h-8 w-8 shadow-lg bg-background/90 backdrop-blur-sm hidden sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Stories Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
      >
        {/* Add Story Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onAddStory}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-dashed border-primary/30 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <Plus className="h-7 w-7 text-primary" />
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Add Story
            </span>
          </button>
        </div>

        {/* Stories */}
        {stories.map((story) => (
          <div key={story.id} className="flex-shrink-0">
            <button
              onClick={() => onViewStory?.(story.id)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="relative">
                {/* Ring gradient for new stories */}
                <div
                  className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-[2px] transition-all duration-300",
                    story.hasNew
                      ? "bg-gradient-to-br from-primary via-primary to-orange-400"
                      : "bg-border/50"
                  )}
                >
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-background p-[2px]">
                    {story.thumbnail ? (
                      <img
                        src={story.thumbnail}
                        alt={story.user.name}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <Avatar className="w-full h-full rounded-xl">
                        <AvatarImage src={story.user.avatar} className="rounded-xl" />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-semibold">
                          {story.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
                {/* User avatar overlay */}
                <Avatar className="absolute -bottom-1 -right-1 h-6 w-6 ring-2 ring-background">
                  <AvatarImage src={story.user.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                    {story.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-16 sm:max-w-20">
                {story.isOwn ? "Your Story" : story.user.name.split(" ")[0]}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && stories.length > 4 && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full h-8 w-8 shadow-lg bg-background/90 backdrop-blur-sm hidden sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
