import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, Store, TrendingUp, Sparkles, ShoppingBag,
  X, Loader2, Tag, ChevronRight, Star, Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { CategoryTabs } from "@/components/CategoryTabs";
import { HomeProductGrid } from "@/components/HomeProductGrid";
import { LocationFilter } from "@/components/LocationFilter";
import { SmartAdsCarousel } from "@/components/SmartAdsCarousel";
import { QuickCategories } from "@/components/home/QuickCategories";
import { RecommendedShops } from "@/components/RecommendedShops";
import { RegionalProducts } from "@/components/RegionalProducts";
import { TopRatedSellers } from "@/components/TopRatedSellers";
import { RecommendedProductsSection } from "@/components/RecommendedProductsSection";
import { TrendingProducts } from "@/components/TrendingProducts";
import { Helmet } from "react-helmet";
import { supabase } from "@/lib/supaseClient";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  type: "product" | "shop" | "seller";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
}

export default function Shop() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      performSearch(debouncedSearch);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearch]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setShowResults(true);
    
    try {
      const results: SearchResult[] = [];
      
      // Search products
      const { data: products } = await supabase
        .from("products")
        .select("id, title, images, price, category")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("status", "approved")
        .limit(5);
      
      products?.forEach(p => {
        results.push({
          type: "product",
          id: p.id,
          title: p.title,
          subtitle: p.category || undefined,
          image: p.images?.[0],
          price: p.price
        });
      });

      // Search shops
      const { data: shops } = await supabase
        .from("shops")
        .select("id, name, logo_url, description")
        .ilike("name", `%${query}%`)
        .eq("is_active", true)
        .limit(3);
      
      shops?.forEach(s => {
        results.push({
          type: "shop",
          id: s.id,
          title: s.name,
          subtitle: "Shop",
          image: s.logo_url || undefined
        });
      });

      // Search sellers
      const { data: sellers } = await supabase
        .from("public_profiles")
        .select("id, full_name, business_name, profile_image")
        .eq("user_type", "seller")
        .or(`full_name.ilike.%${query}%,business_name.ilike.%${query}%`)
        .limit(3);
      
      sellers?.forEach(s => {
        results.push({
          type: "seller",
          id: s.id!,
          title: s.business_name || s.full_name || "Seller",
          subtitle: "Seller",
          image: s.profile_image || undefined
        });
      });

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery("");
    
    switch (result.type) {
      case "product":
        navigate(`/products/${result.id}`);
        break;
      case "shop":
        navigate(`/shops/${result.id}`);
        break;
      case "seller":
        navigate(`/seller/${result.id}`);
        break;
    }
  };

  const handleLocationApply = (pId: string, dId: string, sId: string) => {
    setProvinceId(pId);
    setDistrictId(dId);
    setSectorId(sId);
  };

  const handleLocationClear = () => {
    setProvinceId("");
    setDistrictId("");
    setSectorId("");
  };

  return (
    <>
      <Helmet>
        <title>Shop - Smart World Connect</title>
        <meta name="description" content="Browse products, shops, and sellers on Smart World Connect. Find the best deals." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 pb-24">
        <Navbar />

        <main className="pt-20 space-y-8">
          <div className="container mx-auto px-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Shop</h1>
                <p className="text-muted-foreground text-sm">Find products, shops & sellers</p>
              </div>
            </div>

            {/* Smart Global Search */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search products, shops, sellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  className="pl-12 pr-10 h-14 rounded-2xl bg-muted/50 border-0 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setShowResults(false); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-lg z-50 max-h-[60vh] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-6 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No results found for "{searchQuery}"</p>
                      <p className="text-sm mt-1">Try different keywords</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {result.image ? (
                              <img src={result.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{result.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs capitalize">
                                {result.type}
                              </Badge>
                              {result.subtitle && <span>{result.subtitle}</span>}
                            </div>
                          </div>
                          {result.price && (
                            <span className="font-bold text-primary flex-shrink-0">
                              {result.price.toLocaleString()} RWF
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Smart Ads Carousel */}
          <section className="container mx-auto px-4 lg:px-6">
            <SmartAdsCarousel />
          </section>

          {/* Quick Categories */}
          <section className="container mx-auto px-4 lg:px-6">
            <QuickCategories />
          </section>

          {/* Recommended Shops */}
          <section className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Recommended Shops</h2>
            </div>
            <RecommendedShops />
          </section>

          {/* Local Products */}
          <section className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Local Products</h2>
            </div>
            <RegionalProducts />
          </section>

          {/* Top Rated Sellers */}
          <section className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Top Rated Sellers</h2>
            </div>
            <TopRatedSellers />
          </section>

          {/* Recommended For You */}
          <section className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Recommended For You</h2>
            </div>
            <RecommendedProductsSection />
          </section>

          {/* Trending Products */}
          <section>
            <div className="container mx-auto px-4 lg:px-6 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-destructive" />
                <h2 className="text-lg font-semibold text-foreground">Trending Now</h2>
                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold animate-pulse">
                  🔥 HOT
                </span>
              </div>
            </div>
            <TrendingProducts />
          </section>

          {/* Browse All Products */}
          <section className="container mx-auto px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Browse All Products
                </h2>
                <p className="text-sm text-muted-foreground">Discover amazing deals from verified sellers</p>
              </div>
              <LocationFilter
                provinceId={provinceId}
                districtId={districtId}
                sectorId={sectorId}
                onApply={handleLocationApply}
                onClear={handleLocationClear}
              />
            </div>
            
            <div className="mb-6">
              <CategoryTabs 
                activeCategory={activeCategory} 
                onCategoryChange={setActiveCategory} 
              />
            </div>
            
            <HomeProductGrid 
              category={activeCategory === "All" ? undefined : activeCategory}
              limit={100}
              provinceId={provinceId}
              districtId={districtId}
              sectorId={sectorId}
            />
          </section>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
