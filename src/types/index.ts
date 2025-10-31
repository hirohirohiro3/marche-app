export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  isSoldOut: boolean;
  sortOrder: number;
  manageStock?: boolean;
  stock?: number;
};

export type Order = {
  id: string;
  orderNumber: number;
  items: { name: string; quantity: number }[];
  totalPrice: number;
  status: 'new' | 'paid' | 'completed' | 'cancelled';
  orderType: 'qr' | 'manual';
  createdAt: { seconds: number; nanoseconds: number };
  uid: string;
};
