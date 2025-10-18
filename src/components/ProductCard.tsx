import { Link } from "react-router-dom";
import { Heart, Share2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  location?: string;
  sellerName: string;
  likes?: number;
}

export const ProductCard = ({
  id,
  title,
  price,
  image,
  location,
  sellerName,
  likes = 0,
}: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-hover)]">
      <Link to={`/product/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement like functionality
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement share functionality
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/product/${id}`}>
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-primary">
            {price.toLocaleString()} RWF
          </span>
        </div>
        {location && (
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 mr-1" />
            {location}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          by <span className="font-medium">{sellerName}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link to={`/product/${id}`} className="w-full">
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
