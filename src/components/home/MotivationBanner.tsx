import { useState, useEffect } from "react";
import { Heart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const quotes = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
];

export function MotivationBanner() {
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Select random quote on mount
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  }, []);

  const refreshQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setCurrentQuote(quotes[randomIndex]);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-dark to-foreground p-6 sm:p-8">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-20 h-20 border border-accent-dark-foreground/20 rounded-full" />
        <div className="absolute bottom-4 left-4 w-16 h-16 border border-accent-dark-foreground/20 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-8 h-8 border border-accent-dark-foreground/20 rounded-full" />
      </div>
      
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Heart className="h-5 w-5 fill-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider">Daily Inspiration</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshQuote}
            className="text-accent-dark-foreground/70 hover:text-accent-dark-foreground hover:bg-accent-dark-foreground/10 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${isAnimating ? "animate-spin" : ""}`} />
          </Button>
        </div>
        
        <blockquote className={`transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
          <p className="text-lg sm:text-xl text-accent-dark-foreground font-medium leading-relaxed">
            "{currentQuote.text}"
          </p>
          <footer className="mt-4 text-sm text-accent-dark-foreground/70">
            — {currentQuote.author}
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
