import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (
          full_name,
          business_name
        )
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(8);

    if (!error && data) {
      setProducts(data);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 md:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Welcome to{" "}
                <span className="text-primary">Rwanda Smart Market</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Smart shopping, smarter business. Buy and sell with confidence in Rwanda's premier online marketplace.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button size="lg" className="group">
                    Browse Products
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline">
                    Start Selling
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800"
                alt="Shopping"
                className="rounded-2xl object-cover w-full h-full shadow-[var(--shadow-card)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure Transactions</h3>
              <p className="text-muted-foreground">
                Shop with confidence knowing your transactions are protected
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-primary/10">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Wide Selection</h3>
              <p className="text-muted-foreground">
                Thousands of products from trusted sellers across Rwanda
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-primary/10">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Fast & Easy</h3>
              <p className="text-muted-foreground">
                Quick listings, instant messaging, and seamless buying
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-muted-foreground">
                Discover the latest and greatest from our sellers
              </p>
            </div>
            <Link to="/products">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  image={product.images?.[0] || ""}
                  location={product.location}
                  sellerName={product.profiles?.business_name || product.profiles?.full_name || "Seller"}
                  likes={product.likes}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products available yet
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Start Selling?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of sellers on Rwanda Smart Market and reach customers across the country
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary">
              Create Seller Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Rwanda Smart Market</h3>
              <p className="text-sm text-muted-foreground">
                Smart shopping, smarter business.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Company</h4>
              <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact</Link>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Support</h4>
              <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                <Link to="/help">Help Center</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Sell</h4>
              <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                <Link to="/dashboard">Seller Dashboard</Link>
                <Link to="/pricing">Premium Plans</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Rwanda Smart Market. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
