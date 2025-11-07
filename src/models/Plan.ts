export interface Plan {
  id: string;
  name: string;
  price: number; // In RWF
  productLimit: number;
  updateLimit: number;
  canEditProducts: boolean;
  description: string;
}
