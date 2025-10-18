import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-primary">
            Rwanda Smart Market
          </div>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/products">
            <Button variant="ghost">Products</Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline">
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button>Sell Now</Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col space-y-4 mt-8">
              <Link to="/products">
                <Button variant="ghost" className="w-full justify-start">
                  Products
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button className="w-full">Sell Now</Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden border-t border-border px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>
    </nav>
  );
};
