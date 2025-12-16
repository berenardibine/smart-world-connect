import { getActiveStatus } from "@/utils/activityTracker";
import { Circle } from "lucide-react";

interface SellerActiveStatusProps {
  lastActive: string | null;
  showDot?: boolean;
  className?: string;
}

export const SellerActiveStatus = ({ lastActive, showDot = true, className = "" }: SellerActiveStatusProps) => {
  const status = getActiveStatus(lastActive);
  
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      {showDot && (
        <Circle 
          className={`h-2 w-2 fill-current ${status.color}`} 
        />
      )}
      <span className={status.color}>{status.text}</span>
    </div>
  );
};
