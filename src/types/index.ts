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
  optionGroupIds?: string[];
};

export type OptionChoice = {
  id: string;
  name: string;
  priceModifier: number; // e.g., +100 for +100 yen, 0 for no change
};

export type OptionGroup = {
  id: string;
  storeId: string;
  name: string; // e.g., "サイズ", "トッピング"
  selectionType: 'single' | 'multiple'; // single (radio), multiple (checkbox)
  choices: OptionChoice[];
};

export type SelectedOptionInfo = {
  groupName: string;
  choiceName: string;
  priceModifier: number;
};

export type OrderItem = {
  name: string;
  quantity: number;
  price: number; // Price of the single item with options
  selectedOptions?: SelectedOptionInfo[];
};

export type Order = {
  id:string;
  orderNumber: number;
  items: OrderItem[];
  totalPrice: number;
  status: 'new' | 'paid' | 'completed' | 'cancelled';
  orderType: 'qr' | 'manual';
  createdAt: { seconds: number; nanoseconds: number };
  uid: string;
};
