import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const quotes = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
];

const floatingEmojis = ["💫", "❤️", "🙌", "🌈", "✨", "🔥", "💪", "🌟"];

export function EnhancedMotivation() {
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<{ emoji: string; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    // Select random quote on mount
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
    
    // Generate floating particles
    const newParticles = Array.from({ length: 6 }, () => ({
      emoji: floatingEmojis[Math.floor(Math.random() * floatingEmojis.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  const refreshQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * quotes.length);
      } while (quotes[newIndex].text === currentQuote.text);
      
      setCurrentQuote(quotes[newIndex]);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-chart-4 to-chart-5 p-6 sm:p-8">
      {/* Floating emojis */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute text-xl sm:text-2xl opacity-30 animate-bounce-soft pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
      
      {/* Glowing orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full blur-2xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-primary-foreground/90 uppercase tracking-wider">
              Daily Inspiration
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshQuote}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-xl h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isAnimating ? "animate-spin" : ""}`} />
          </Button>
        </div>
        
        {/* Quote */}
        <blockquote className={`transition-all duration-300 ${isAnimating ? "opacity-0 transform translate-y-2" : "opacity-100 transform translate-y-0"}`}>
          <p className="text-lg sm:text-xl text-primary-foreground font-medium leading-relaxed mb-4">
            &ldquo;{currentQuote.text}&rdquo;
          </p>
          <footer className="text-sm text-primary-foreground/70">
            — {currentQuote.author}
          </footer>
        </blockquote>
        
        {/* See More Link */}
        <Link 
          to="/academy"
          className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground transition-colors group"
        >
          Explore Smart Academy
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
