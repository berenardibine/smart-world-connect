import { useState, useEffect, useRef } from "react";
import { Search, X, User, Store, Package, Globe, Users, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const filterOptions = [
  { id: "all", label: "All", icon: Search },
  { id: "users", label: "Users", icon: User },
  { id: "shops", label: "Shops", icon: Store },
  { id: "products", label: "Products", icon: Package },
  { id: "communities", label: "Communities", icon: Globe },
  { id: "groups", label: "Groups", icon: Users },
];

const recentSearches = [
  "Electronics near me",
  "Fresh vegetables",
  "Mobile phones",
  "Fashion trends",
];

const trendingSearches = [
  "Smart gadgets",
  "Organic food",
  "Home decor",
  "Sports equipment",
  "Beauty products",
];

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement actual search
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          {/* Header */}
          <div className="sticky top-0 bg-background border-b border-border/50 p-4 safe-area-top">
            <div className="flex items-center gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users, shops, products..."
                  className="pl-12 pr-4 h-12 rounded-2xl bg-muted/50 border-0 text-base focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-12 w-12 hover:bg-muted"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="mt-4 overflow-x-auto scrollbar-hide max-w-2xl mx-auto">
              <div className="flex gap-2 pb-2">
                {filterOptions.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-w-2xl mx-auto overflow-y-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
            {searchQuery === "" ? (
              <div className="space-y-6">
                {/* Recent Searches */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Recent Searches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(search)}
                        className="px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Trending */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Trending Now</h3>
                  </div>
                  <div className="space-y-2">
                    {trendingSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(search)}
                        className="flex items-center gap-3 w-full p-3 rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors group"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {i + 1}
                        </span>
                        <span className="text-foreground group-hover:text-primary transition-colors">
                          {search}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center py-8">
                  Search results for "{searchQuery}" will appear here...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
