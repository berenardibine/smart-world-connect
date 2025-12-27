import { Link } from "react-router-dom";
import { 
  Smartphone, 
  Shirt, 
  Home as HomeIcon, 
  Car, 
  Dumbbell, 
  Book, 
  Sparkles as SparklesIcon,
  Sprout,
  Wrench,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { name: "Electronics", icon: Smartphone, color: "bg-blue-500/10 text-blue-500", path: "/category/Electronics" },
  { name: "Fashion", icon: Shirt, color: "bg-pink-500/10 text-pink-500", path: "/category/Fashion" },
  { name: "Home", icon: HomeIcon, color: "bg-green-500/10 text-green-500", path: "/category/Home & Garden" },
  { name: "Auto", icon: Car, color: "bg-orange-500/10 text-orange-500", path: "/category/Automotive" },
  { name: "Sports", icon: Dumbbell, color: "bg-purple-500/10 text-purple-500", path: "/category/Sports & Outdoors" },
  { name: "Books", icon: Book, color: "bg-amber-500/10 text-amber-500", path: "/category/Books" },
  { name: "Beauty", icon: SparklesIcon, color: "bg-rose-500/10 text-rose-500", path: "/category/Health & Beauty" },
  { name: "Agri", icon: Sprout, color: "bg-emerald-500/10 text-emerald-500", path: "/agriculture" },
  { name: "Rentals", icon: Wrench, color: "bg-cyan-500/10 text-cyan-500", path: "/equipment" },
  { name: "More", icon: MoreHorizontal, color: "bg-muted text-muted-foreground", path: "/categories" },
];

export function QuickCategories() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">Categories</h2>
        <Link to="/categories" className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>
      
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.name}
              to={category.path}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
                category.color
              )}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
