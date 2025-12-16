import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";

interface ProductDiscountBadgeProps {
  discount: number;
  originalPrice: number;
}

export const ProductDiscountBadge = ({ discount, originalPrice }: ProductDiscountBadgeProps) => {
  if (!discount || discount <= 0) return null;

  const discountedPrice = originalPrice - (originalPrice * discount / 100);

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="destructive" className="w-fit">
        <Percent className="h-3 w-3 mr-1" />
        {discount}% OFF
      </Badge>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground line-through">
          {originalPrice.toLocaleString()} RWF
        </span>
        <span className="text-lg font-bold text-red-500">
          {discountedPrice.toLocaleString()} RWF
        </span>
      </div>
    </div>
  );
};

export const calculateDiscountedPrice = (price: number, discount: number): number => {
  if (!discount || discount <= 0) return price;
  return price - (price * discount / 100);
};
